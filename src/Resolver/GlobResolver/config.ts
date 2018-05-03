import { mergeWith, uniq, isPlainObject, intersection, difference } from 'lodash';
import { Substitution, defaultSubstitutions } from '../../substitution';
import { ExecSyncOptionsWithBufferEncoding } from 'child_process';
import { inherits, isArray } from 'util';
import { getActiveFileUri } from '../../fsTools';
import { getConfig } from '../../compat';
import { Uri } from 'vscode';
import { COMMAND_IDs, CONFIG_IDs } from '../../constants';
import { INHERITS_KEYWORD, GlobOptions, GlobResolverConfig, ExplicitGlobResolver, GlobResolver } from './config.jsonSchema';

const defaultOptions: GlobOptions = {
    basename: false,
    bash: true,
    dot: false,
};

const mergeOptions = (opts: GlobOptions = {}, ...parents: (GlobOptions | undefined)[]): GlobOptions => mergeWith(
    {},
    defaultOptions,
    ...(parents.filter(parent => parent !== undefined)),
    opts,
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

const requiredResolverKeys = ['input', 'output'];
const allowedResolverKeys = ['input', 'output', 'options'];

function validateResolver(resolver: GlobResolver): true | string {
    if (!isPlainObject(resolver)) {
        return 'Expected an object defining a resolver.';
    } else {
        const keys = Object.keys(resolver);
        const missing = requiredResolverKeys.reduce((reduction, requiredKey) => (
            ((keys.includes(requiredKey)
                ? reduction
                : [...reduction, `The required key '${requiredKey}' is missing in this resolver definition!`]
            )
        )), []);
        if (missing.length) {
            return missing.join(' ');
        } else {
            const unexpected = difference(keys, allowedResolverKeys).reduce((reduction, unexpectedKey) => [
                ...reduction,
                `An unexpected key '${unexpectedKey}' was encountered in this resolver definition!`
            ], []);
            if (unexpected.length) {
                return unexpected.join(' ');
            } else {
                if (keys.includes('options')) {
                    /// TODO ::: validate options key
                } else {
                    return true;
                }
            }
        }
        return true;
    }
}

export function normalizeResolverConfig(raw: GlobResolverConfig): ExplicitGlobResolver[];
export function normalizeResolverConfig(raw: GlobResolverConfig, suppressErrors: true): ExplicitGlobResolver[];
export function normalizeResolverConfig(raw: GlobResolverConfig, suppressErrors: false): ExplicitGlobResolver[] | null;
export function normalizeResolverConfig(raw: GlobResolverConfig, suppressErrors?: boolean): ExplicitGlobResolver[] | null;
export function normalizeResolverConfig(_raw: GlobResolverConfig, suppressErrors: boolean = true): ExplicitGlobResolver[] {
    const raw = Array.isArray(_raw) ? _raw : [_raw];
    const result: ExplicitGlobResolver[] = [];

    raw.forEach(resolver => {
        if (isPlainObject(resolver)) {
            return;
        } else {
            if (suppressErrors) {
                console.warn({
                    raw: _raw,
                    msg: 'unexpected resolver format',
                    resolver
                });
            }
        }
    });

    return result;
}

export function getGlobResolverConfig(resource?: Uri): GlobResolverConfig | null {
    const cfg = getConfig(resource);
    if (cfg.has(CONFIG_IDs.globResolver)) {
        return cfg.get(CONFIG_IDs.globResolver, null);
    } else {
        return null;
    }
}