import { Uri } from 'vscode';
import { mergeWith, isPlainObject, uniq } from 'lodash';

import { getConfig } from '../../compat';
import { CONFIG_IDs } from '../../constants';
import { INHERITS_KEYWORD, GlobOptions, GlobResolverConfig, ExplicitGlobResolver, GlobResolver, PartialGlobOptions } from './schema';

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

export const mergeOptions = (...opts: (PartialGlobOptions | undefined)[]): GlobOptions => mergeWith(
    {},
    defaultOptions,
    ...(opts.filter(parent => parent !== undefined)),
    (objVal: any, srcVal: any, key: any): any => {
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
);

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

export function getGlobResolverConfig(resource?: Uri): GlobResolverConfig | null {
    const cfg = getConfig(resource);
    return cfg.get(CONFIG_IDs.globResolver, null);
}