import * as mm from 'micromatch';
import { SingleGlob } from './schema';
import { ExplicitGlobResolver } from './config';

import { SubstitutionContext, substitute } from '../../substitution';
import { Uri } from 'vscode';
import { Dictionary } from 'lodash';

export interface SubbedExplicitGlobResolver extends ExplicitGlobResolver {
    subbedInput: SingleGlob;
}

export type ResourceResolutionMap = Map<Uri, SubbedExplicitGlobResolver[]>;
export type TruncatedResourceResolutionMap = Map<Uri, SubbedExplicitGlobResolver | null>;

async function substituteInput(resolver: ExplicitGlobResolver, ctx: Partial<SubstitutionContext> = {}): Promise<SubbedExplicitGlobResolver | null> {
    const subbed = await substitute(resolver.input, ctx).then(v => v).catch(() => null);
    return (subbed !== null) ? { ...resolver, subbedInput: subbed } : subbed;
}

async function substituteOutput(outputPattern: string, ctx: Partial<SubstitutionContext> = {}): Promise<string | null> {
    const subbed = await substitute(outputPattern, ctx).then(v => v).catch(() => null);
    return (subbed !== null) ? null;
}

const matchesInput = (resource: Uri, resolver: SubbedExplicitGlobResolver): boolean => (
    mm.isMatch(resource.fsPath, resolver.subbedInput, resolver.options)
);

export async function resolveOutput(resolver: SubbedExplicitGlobResolver, resource: Uri): Promise<Uri | null> {
    const captures = mm.capture(resolver.subbedInput, resource.fsPath);
    if (captures === null) {
        return null;
    } else {
        return null;
    }
}

export async function allMatchingResources(resolvers: ExplicitGlobResolver[], resources: Uri[]): Promise<ResourceResolutionMap>  {
    const matching: ResourceResolutionMap = new Map();
    await Promise.all(resources.map(async resource => {
        const resolved = (await Promise.all(resolvers.map(async resolver => {
            const subbed = await substituteInput(resolver, { activeFile: resource });
            if (subbed) {
                if (matchesInput(resource, subbed)) {
                    return subbed;
                } else {
                    return null;
                }
            } else {
                return null;
            }
        }))).filter((v): v is SubbedExplicitGlobResolver => v !== null); // note use of explicit typeguard on Array.filter's predicate (typescript cant infer conditional in predicate)
        if (resolved.length) {
            matching.set(resource, resolved);
        }
    }));
    return matching;
}

export async function firstMatchingResolver(resolvers: ExplicitGlobResolver[], resource: Uri): Promise<SubbedExplicitGlobResolver | null> {
    const result = await allMatchingResolversMulti(resolvers, [resource]);
    const { fsPath } = resource;
    if (result.has(fsPath)) {
        return (result.get(fsPath) as SubbedExplicitGlobResolver[])[0];
    } else {
        return null;
    }
}