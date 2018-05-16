import * as mm from 'micromatch';
import { ExplicitGlobResolver, SingleGlob } from './schema';

import { SubstitutionContext, substitute } from '../../substitution';
import { Uri } from 'vscode';

export interface SubbedExplicitGlobResolver extends ExplicitGlobResolver {
    subbedInput: SingleGlob;
}

export type ResolvedResourceMap = Map<string, SubbedExplicitGlobResolver[]>;

async function substituteInput(resolver: ExplicitGlobResolver, ctx: Partial<SubstitutionContext> = {}): Promise<SubbedExplicitGlobResolver> {
    const subbed = await substitute(resolver.input, ctx);
    return { ...resolver, subbedInput: subbed };
}

export async function allMatchingResolvers(resolvers: ExplicitGlobResolver[], resources: Uri[]): Promise<ResolvedResourceMap>  {
    const matching: ResolvedResourceMap = new Map();
    await Promise.all(resolvers.map(async (resolver) => {
        for (let i = 0; i < resources.length; i++) {
            const subbed = await substituteInput(resolver, {
                activeFile: resources[i]
            });
            if (mm.isMatch(resources[i].fsPath, subbed.subbedInput, subbed.options)) {
                const { fsPath } = resources[i];
                if (matching.has(fsPath)) {
                    matching.set(fsPath, [...(matching.get(fsPath) as SubbedExplicitGlobResolver[]), subbed]);
                } else {
                    matching.set(resources[i].toString(), [subbed]);
                }
            }
        }
    }));
    return matching;
}

export async function firstMatchingResolver(resolvers: ExplicitGlobResolver[], resource: Uri): Promise<SubbedExplicitGlobResolver | null> {
    const result = await allMatchingResolvers(resolvers, [resource]);
    const { fsPath } = resource;
    if (result.has(fsPath)) {
        return (result.get(fsPath) as SubbedExplicitGlobResolver[])[0];
    } else {
        return null;
    }
}