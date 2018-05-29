import * as mm from 'micromatch';

import { Uri } from 'vscode';

import { SingleGlob } from './schema';
import { ExplicitGlobResolver } from './config';
import { substitute } from '../../substitution';
import { predicateRace, wrapRejection } from '../../misc';
import { fileExists } from '../../fsTools';
import { globSubstitutions, OutputPatternContext } from '../GlobResolver';

export interface Match {
    resolver: ExplicitGlobResolver;
    inputUri: Uri;
}

export interface ResolvedInput extends Match {
    inputGlob: SingleGlob;
}

export interface ResolvedOutput extends ResolvedInput {
    outputUri: Uri;
}

export type ResourceResolutionMap = Map<Uri, ResolvedOutput[]>;
export type TruncatedResourceResolutionMap = Map<Uri, ResolvedOutput>;

export async function resolveInput(resource: Match): Promise<ResolvedInput | null> {
    const inputGlob = await substitute(resource.resolver.input, { activeFile: resource.inputUri }).catch(() => null);
    if (inputGlob === null) return null;
    else {
        if (mm.isMatch(resource.inputUri.fsPath, inputGlob, resource.resolver.options)) {
            return {
                ...resource,
                inputGlob
            };
        } else {
            return null;
        }
    }
}

export async function resolveOutput(resource: ResolvedInput): Promise<ResolvedOutput | null> {
    const captures = mm.capture(resource.inputGlob, resource.inputUri.fsPath) || [];
    const outputPath = await substitute<OutputPatternContext>(
        resource.resolver.input,
        { activeFile: resource.inputUri, data: { captures } },
        globSubstitutions
    ).catch(() => null);

    if (outputPath === null) return null;
    else {
        const outputUri = Uri.file(outputPath);
        if (await fileExists(outputUri)) {
            return {
                ...resource,
                outputUri
            };
        } else {
            return null;
        }
    }
}

export async function allMatches(resolvers: ExplicitGlobResolver[], resources: Uri[]): Promise<ResourceResolutionMap>;
export async function allMatches(resolvers: ExplicitGlobResolver[], resource: Uri): Promise<ResolvedOutput[]>;
export async function allMatches(resolvers: ExplicitGlobResolver[], resources: Uri | Uri[]): Promise<ResourceResolutionMap | ResolvedOutput[]> {
    if (Array.isArray(resources)) {
        const matching: ResourceResolutionMap = new Map();
        await Promise.all(resources.map(async resource => {
            const resolved = (await Promise.all(resolvers.map(async resolver => {
                const input = await resolveInput({ resolver, inputUri: resource });
                if (input !== null) {
                    const output = await resolveOutput(input);
                    if (output !== null) {
                        return output;
                    } else {
                        return null;
                    }
                } else {
                    return null;
                }
            }))).filter((v): v is ResolvedOutput => v !== null); // note use of explicit typeguard on Array.filter's predicate (typescript cant infer conditional in predicate)
            if (resolved.length) {
                matching.set(resource, resolved);
            }
        }));
        return matching;
    } else {
        const resultMap = await allMatches(resolvers, [ resources ]);
        return ((resultMap.size)
            ? resultMap.get(resources) as ResolvedOutput[]
            : []
        );
    }
}

export async function firstMatch(resolvers: ExplicitGlobResolver[], resource: Uri): Promise<ResolvedOutput | null>;
export async function firstMatch(resolvers: ExplicitGlobResolver[], resources: Uri[]): Promise<TruncatedResourceResolutionMap>;
export async function firstMatch(resolvers: ExplicitGlobResolver[], resources: Uri | Uri[]): Promise<TruncatedResourceResolutionMap | (ResolvedOutput | null)> {
    if (Array.isArray(resources)) {
        const matching: TruncatedResourceResolutionMap = new Map();
        await Promise.all(resources.map(async resource => {
            const resolved = await wrapRejection(predicateRace(resolvers.map(async resolver => {
                const input = await resolveInput({ resolver, inputUri: resource });
                if (input !== null) {
                    const output = await resolveOutput(input);
                    if (output !== null) {
                        return output;
                    } else {
                        return null;
                    }
                } else {
                    return null;
                }
            }), v => v !== null), null);
            if (resolved) {
                matching.set(resource, resolved);
            }
        }));
        return matching;
    } else {
        const resultMap = await firstMatch(resolvers, [ resources ]);
        return ((resultMap.size)
            ? resultMap.get(resources) as ResolvedOutput
            : null
        );
    }
}
