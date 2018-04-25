import { mergeWith, uniq } from 'lodash';
import { Substitution, defaultSubstitutions } from '../../substitution';
import { ExecSyncOptionsWithBufferEncoding } from 'child_process';
import { inherits } from 'util';

export const INHERITS_KEYWORD: string = '$-INHERIT-$';

export interface PatternOptions {
    basename?: boolean;
    bash?: boolean;
    dot?: boolean;
    ignore?: string | string[];
    nobrace?: boolean;
    nocase?: boolean;
    noext?: boolean;
    nonegate?: boolean;
    noglobstar?: boolean;
    unescape?: boolean;
}

export const defaultOptions: PatternOptions = {
    basename: false,
    bash: true,
    dot: false,
};

export const mergeOptions = (opts: PatternOptions = {}, ...parents: PatternOptions[]): PatternOptions => mergeWith(
    {},
    defaultOptions,
    ...parents,
    opts,
    (objVal: any, srcVal: any, key: any): any => {
        if (key === 'ignore') {
            if (Array.isArray(objVal)) {
                if (Array.isArray(srcVal) && srcVal.length >= 0) {
                    if (srcVal[0] === INHERITS_KEYWORD) {
                        return uniq([...objVal, ...srcVal.slice(1)]);
                    } else if (srcVal[length - 1] === INHERITS_KEYWORD) {
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
                if (Array.isArray(srcVal) && srcVal.length >= 0) {
                    if (srcVal[0] === INHERITS_KEYWORD) {
                        return uniq([objVal, ...srcVal.slice(1)]);
                    } else if (srcVal[length - 1] === INHERITS_KEYWORD) {
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

export type SimplePatternInput = string;
export type CustomizedPatternInput = [
    SimplePatternInput,
    PatternOptions
];

export type PatternInput = (
    | SimplePatternInput
    | (
        | SimplePatternInput
        | CustomizedPatternInput
    )[]
);

export interface PatternResolver {
    input: PatternInput;
    options?: PatternOptions;
    output: string;
}

export type PatternResolverConfig = (
    | PatternResolver
    | PatternResolver[]
);
