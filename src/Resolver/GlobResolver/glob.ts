import * as mm from 'micromatch';
import { SingleGlob } from './schema';
import { ExplicitGlobResolver } from './config';

import { SubstitutionContext } from '../../substitution/api';
import { substitute } from '../../substitution';
import { Uri } from 'vscode';
import { isArray } from 'util';
import { SOFT_REJECTION, NO_ARG } from '../../constants';

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
    return (subbed !== null) ? subbed : null;
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

export async function allMatches(resolvers: ExplicitGlobResolver[], resources: Uri[]): Promise<ResourceResolutionMap>;
export async function allMatches(resolvers: ExplicitGlobResolver[], resource: Uri): Promise<SubbedExplicitGlobResolver[]>;
export async function allMatches(resolvers: ExplicitGlobResolver[], resources: Uri | Uri[]): Promise<ResourceResolutionMap | SubbedExplicitGlobResolver[]> {
    if (Array.isArray(resources)) {
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
    } else {
        const resultMap = await allMatches(resolvers, [ resources ]);
        return ((resultMap.size)
            ? resultMap.get(resources) as SubbedExplicitGlobResolver[]
            : []
        );
    }
}

export async function firstMatch(resolvers: ExplicitGlobResolver[], resource: Uri): Promise<SubbedExplicitGlobResolver | null>;
export async function firstMatch(resolvers: ExplicitGlobResolver[], resources: Uri[]): Promise<TruncatedResourceResolutionMap>;
export async function firstMatch(resolvers: ExplicitGlobResolver[], resources: Uri | Uri[]): Promise<TruncatedResourceResolutionMap | (SubbedExplicitGlobResolver | null)> {
    if (isArray(resources)) {
        const matching: TruncatedResourceResolutionMap = new Map();
        await Promise.all(resources.map(async resource => {
            const resolved = (await Promise.race(resolvers.map(async resolver => {
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
            })));
            if (resolved)
        }));
        return matching;
    } else {
        const resultMap = await firstMatch(resolvers, [ resources ]);
        return ((resultMap.size)
            ? resultMap.get(resources) as SubbedExplicitGlobResolver
            : null
        );
    }
    return null;
}

export interface BaseBungleBehavior {
    strategy: 'defaultValue' | 'reject';
}

export interface RejectionBungleBehavior extends BaseBungleBehavior {
    strategy: 'reject';
}

export interface DefaultValueBungleBehavior<D = any> extends BaseBungleBehavior {
    strategy: 'defaultValue';
    defaultValue: D;
}

export type BungleBehavior<D = any> = (
    | RejectionBungleBehavior
    | DefaultValueBungleBehavior<D>
);


const rejectionBungleBehavior: BungleBehavior = { strategy: 'reject' };

const wrapRejections = <T, D>(promise: Promise<T>, defaultValue: D = NO_ARG as any) => ((promise)
    .then(v => v)
    .catch(e => {
        console.error(e);
        return defaultValue;
    }
);

export function predicateRace<T, D>(
    promises: Promise<T>[],
    predicate: ((v: T) => boolean),
    bungleBehavior: BungleBehavior<D> = rejectionBungleBehavior,
    suppressRejections: boolean = true
): Promise<T | D> {

};


export function rejectionRace<T>(promises: Promise<T>[]): Promise<T>;
export function rejectionRace<T>(promises: Promise<T>[], bungleBehavior: RejectionBungleBehavior): Promise<T>;
export function rejectionRace<T, D>(promises: Promise<T>[], bungleBehavior: BungleBehavior<D>): Promise<T | D>;
export function rejectionRace<T, D>(promises: Promise<T>[], bungleBehavior: BungleBehavior<D> = rejectionBungleBehavior): Promise<T | D> {
    return new Promise((resolve, reject) => {
        let resolved: boolean = false;
        Promise.all(promises.map(promise => ((promise)
            .then(v => {
                resolved = true;
                resolve(v);
            })
            .catch(e => {
                console.log(e);
            })
        ))).then(() => {
            if (!resolved) {
                if (bungleBehavior.strategy === 'reject') {
                    reject('All of the promises rejected.');
                } else {
                    resolve(bungleBehavior.value);
                }
            } // otherwise its already resolved
        });
    });
}