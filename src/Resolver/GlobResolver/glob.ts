import * as mm from 'micromatch';

import { Uri } from 'vscode';

import { SingleGlob } from './schema';
import { ExplicitGlobResolver } from './config';
import { substitute } from '../../substitution';
import { predicateRace, fallback } from '../../misc';
import { fileExists } from '../../fsTools';
import { globSubstitutions, OutputPatternContext } from '../GlobResolver';
import { convertPathSeparators } from '../../compat';

export interface GlobMatch {
    resolver: ExplicitGlobResolver;
    inputUri: Uri;
}

export interface ResolvedGlobMatch extends GlobMatch {
    inputGlob: SingleGlob;
    outputUri: Uri;
}

export type ResourceResolutionMap = Map<Uri, ResolvedGlobMatch[]>;
export type TruncatedResourceResolutionMap = Map<Uri, ResolvedGlobMatch>;

export async function resolveMatch({ resolver, inputUri }: GlobMatch): Promise<ResolvedGlobMatch | null> {
    const dirtyInputGlob = await fallback(substitute(resolver.input, { activeFile: inputUri }), null);
    if (dirtyInputGlob !== null) {
        const inputGlob = convertPathSeparators(dirtyInputGlob, true);
        const unixPath = convertPathSeparators(inputUri.fsPath, true);
        if (mm.isMatch(unixPath, inputGlob, resolver.options)) {
            const captures = mm.capture(inputGlob, unixPath, resolver.options) || [];
            const dirtyOutputPath = await fallback(substitute<OutputPatternContext>(
                resolver.output,
                { activeFile: inputUri, data: { captures } },
                globSubstitutions
            ), null);

            if (dirtyOutputPath === null) return null;
            else {
                const outputUri = Uri.file(convertPathSeparators(dirtyOutputPath));
                if (await fileExists(outputUri)) {
                    return {
                        resolver,
                        inputUri,
                        inputGlob,
                        outputUri
                    };
                } else {
                    return null;
                }
            }
        } else {
            return null;
        }
    } else {
        return null;
    }
}

export async function allMatches(resolvers: ExplicitGlobResolver[], resources: Uri[]): Promise<ResourceResolutionMap>;
export async function allMatches(resolvers: ExplicitGlobResolver[], resource: Uri): Promise<ResolvedGlobMatch[]>;
export async function allMatches(resolvers: ExplicitGlobResolver[], resources: Uri | Uri[]): Promise<ResourceResolutionMap | ResolvedGlobMatch[]> {
    if (Array.isArray(resources)) {
        const matching: ResourceResolutionMap = new Map();
        await Promise.all(resources.map(async resource => {
            const resolved = (await Promise.all(resolvers.map(resolver => (
                resolveMatch({ resolver, inputUri: resource })
            )))).filter((v): v is ResolvedGlobMatch => v !== null); // note use of explicit typeguard on Array.filter's predicate (typescript cant infer conditional in predicate)
            if (resolved.length) {
                matching.set(resource, resolved);
            }
        }));
        return matching;
    } else {
        return (await Promise.all(resolvers.map(resolver => (
            resolveMatch({ resolver, inputUri: resources })
        )))).filter((v): v is ResolvedGlobMatch => v !== null);
    }
}

export async function firstMatch(resolvers: ExplicitGlobResolver[], resource: Uri): Promise<ResolvedGlobMatch | null>;
export async function firstMatch(resolvers: ExplicitGlobResolver[], resources: Uri[]): Promise<TruncatedResourceResolutionMap>;
export async function firstMatch(resolvers: ExplicitGlobResolver[], resources: Uri | Uri[]): Promise<TruncatedResourceResolutionMap | (ResolvedGlobMatch | null)> {
    if (Array.isArray(resources)) {
        const matching: TruncatedResourceResolutionMap = new Map();
        await Promise.all(resources.map(async resource => {
            const resolved = await fallback(predicateRace(resolvers.map(resolver => (
                resolveMatch({ resolver, inputUri: resource })
            )), v => v !== null), null);
            if (resolved) {
                matching.set(resource, resolved);
            }
        }));
        return matching;
    } else {
        return fallback(predicateRace(resolvers.map(resolver => (
            resolveMatch({ resolver, inputUri: resources })
        )), v => v !== null), null);
    }
}
