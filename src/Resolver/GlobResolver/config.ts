import { Uri } from 'vscode';
import { mergeWith, tap, isPlainObject, uniq } from 'lodash';

import { getConfig } from '../../compat/config';
import { CONFIG_IDs } from '../../constants';
import { INHERITS_KEYWORD, GlobOptions, GlobResolverConfig, GlobResolver, PartialGlobOptions, UNDEFINED_KEYWORD, SingleGlob } from './schema';

export interface ExplicitGlobResolver extends GlobResolver {
    input: SingleGlob;
    options: GlobOptions;
    output: string;
}


export const defaultOptions: GlobOptions = {
    basename: false,
    bash: true,
    dot: false,
    ignore: undefined,
    nobrace: false,
    nocase: false,
    noext: false,
    noglobstar: false,
    nonegate: false,
    unescape: false
};

export const mergeOptions = (...opts: (PartialGlobOptions | undefined)[]): GlobOptions => tap(mergeWith(
    {},
    defaultOptions,
    ...(opts.filter(parent => parent !== undefined)),
    (objVal: PartialGlobOptions, srcVal: GlobOptions, key: keyof GlobOptions): any => {
        if (key === 'ignore') {
            if (Array.isArray(objVal)) {
                if (Array.isArray(srcVal) && srcVal.length >= 1) {
                    if (srcVal[0] === INHERITS_KEYWORD) {
                        return uniq([...objVal, ...srcVal.slice(1)]);
                    } else if (srcVal[srcVal.length - 1] === INHERITS_KEYWORD) {
                        return uniq([...srcVal.slice(0, -1), ...objVal]);
                    } else {
                        return srcVal;
                    }
                } else if (srcVal === undefined) {
                    return objVal;
                } else {
                    return srcVal;
                }
            } else if (typeof objVal === 'string') {
                if (Array.isArray(srcVal) && srcVal.length >= 1) {
                    if (srcVal[0] === INHERITS_KEYWORD) {
                        return uniq([objVal, ...srcVal.slice(1)]);
                    } else if (srcVal[srcVal.length - 1] === INHERITS_KEYWORD) {
                        return uniq([...srcVal.slice(0, -1), objVal]);
                    } else {
                        return srcVal;
                    }
                } else if (srcVal === undefined) {
                    return objVal;
                } else {
                    return srcVal;
                }
            } else return srcVal;
        }
    }
), (v: GlobOptions) => {
    if (v && v.ignore && v.ignore === UNDEFINED_KEYWORD) {
        v.ignore = undefined;
    }
    return v;
});


///  TODO :: factor out `suppressErrors`
///  TODO :: throw error (custom/extended) but log nothing --> let wrapper cover that
export function normalizeResolverConfig(raw: GlobResolverConfig): ExplicitGlobResolver[];
export function normalizeResolverConfig(raw: GlobResolverConfig, suppressErrors: true): ExplicitGlobResolver[] | null;
export function normalizeResolverConfig(raw: GlobResolverConfig, suppressErrors: false): ExplicitGlobResolver[];
export function normalizeResolverConfig(raw: GlobResolverConfig, suppressErrors?: boolean): ExplicitGlobResolver[] | null;
export function normalizeResolverConfig(raw: GlobResolverConfig, suppressErrors: boolean = true): ExplicitGlobResolver[] | null {
    if (suppressErrors) {
        try {
            const result = normalizeResolverConfig(raw, false);
            return result;
        } catch (e) {
            console.error(e);
            return null;
        }
    } else {
        const resolvers = Array.isArray(raw) ? raw : [raw];
        const results: ExplicitGlobResolver[] = [];
        resolvers.forEach(resolver => {
            if (typeof resolver.input === 'string') {
                const result: ExplicitGlobResolver = {} as any;
                result.input = resolver.input;
                result.output = resolver.output;
                result.options = mergeOptions(resolver.options);
                results.push(result);
            } else if (Array.isArray(resolver.input)) { // typeof resolver.input === (Glob|CustomizedGlob)[]
                const inputs = resolver.input;
                inputs.forEach(input => {
                    if (typeof input === 'string') {
                        const result: ExplicitGlobResolver = {} as any;
                        result.input = input;
                        result.output = resolver.output;
                        result.options = mergeOptions(resolver.options);
                        results.push(result);
                    } else if (isPlainObject(input)) {
                        if (typeof input.pattern === 'string') {
                            const result: ExplicitGlobResolver = {} as any;
                            result.input = input.pattern;
                            result.output = resolver.output;
                            result.options = mergeOptions(resolver.options, input.options);
                            results.push(result);
                        } else if (Array.isArray(input.pattern)) {
                            input.pattern.forEach(pattern => {
                                if (typeof pattern === 'string') {
                                    const result: ExplicitGlobResolver = {} as any;
                                    result.input = pattern;
                                    result.output = resolver.output;
                                    result.options = mergeOptions(resolver.options, input.options);
                                    results.push(result);
                                } else {
                                    console.error({
                                        input,
                                        resolver,
                                        resolvers,
                                        pattern: pattern,
                                        msg: 'Unexpected pattern format!'
                                    });
                                    throw new TypeError('Unexpected pattern format!');
                                }
                            });
                        } else {
                            console.error({
                                input,
                                resolver,
                                resolvers,
                                pattern: input.pattern,
                                msg: 'Unexpected pattern format!'
                            });
                            throw new TypeError('Unexpected pattern format!');
                        }
                    } else {
                        console.error({
                            input,
                            resolver,
                            resolvers,
                            msg: 'Unexpected input format!'
                        });
                        throw new TypeError('Unexpected input format!');
                    }
                });
            } else if (isPlainObject(resolver.input)) {
                const { input } = resolver;
                if (typeof input === 'string') {
                    const result: ExplicitGlobResolver = {} as any;
                    result.input = input;
                    result.output = resolver.output;
                    result.options = mergeOptions(resolver.options);
                    results.push(result);
                } else if (isPlainObject(input)) {
                    if (typeof input.pattern === 'string') {
                        const result: ExplicitGlobResolver = {} as any;
                        result.input = input.pattern;
                        result.output = resolver.output;
                        result.options = mergeOptions(resolver.options, input.options);
                        results.push(result);
                    } else if (Array.isArray(input.pattern)) {
                        input.pattern.forEach(pattern => {
                            if (typeof pattern === 'string') {
                                const result: ExplicitGlobResolver = {} as any;
                                result.input = pattern;
                                result.output = resolver.output;
                                result.options = mergeOptions(resolver.options, input.options);
                                results.push(result);
                            } else {
                                console.error({
                                    input,
                                    resolver,
                                    resolvers,
                                    pattern: pattern,
                                    msg: 'Unexpected pattern format!'
                                });
                                throw new TypeError('Unexpected pattern format!');
                            }
                        });
                    } else {
                        console.error({
                            input,
                            resolver,
                            resolvers,
                            pattern: input.pattern,
                            msg: 'Unexpected pattern format!'
                        });
                        throw new TypeError('Unexpected pattern format!');
                    }
                } else {
                    console.error({
                        input,
                        resolver,
                        resolvers,
                        msg: 'Unexpected input format!'
                    });
                    throw new TypeError('Unexpected input format!');
                }
            } else {
                console.error({
                    resolver,
                    resolvers,
                    msg: 'Unexpected resolver format!'
                });
                throw new TypeError('Unexpected resolver format!');
            }
        });

        return results;
    }
}

export function getGlobResolverConfig(resource?: Uri): ExplicitGlobResolver[] | null {
    const cfg = getConfig(resource);
    const resolverCfg = cfg.get<GlobResolverConfig | null>(CONFIG_IDs.globResolver, null);
    if (resolverCfg) {
        return normalizeResolverConfig(resolverCfg);
    } else {
        return null;
    }
}