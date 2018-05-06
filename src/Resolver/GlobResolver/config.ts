import { mergeWith, uniq, isPlainObject, intersection, difference } from 'lodash';
import { Substitution, defaultSubstitutions } from '../../substitution';
import { ExecSyncOptionsWithBufferEncoding } from 'child_process';
import { inherits, isArray } from 'util';
import { getActiveFileUri } from '../../fsTools';
import { getConfig } from '../../compat';
import { Uri } from 'vscode';
import { COMMAND_IDs, CONFIG_IDs } from '../../constants';

export type INHERITS_KEYWORD = '$-INHERIT-$ ';
export const INHERITS_KEYWORD: INHERITS_KEYWORD = '$-INHERIT-$ ';

export interface GlobOptions {
    /**
     * @default false
     */
    basename?: boolean;
    /**
     * @default true
     */
    bash?: boolean;
    /**
     * @default false
     */
    dot?: boolean;
    ignore?: string | string[];
    nobrace?: boolean;
    nocase?: boolean;
    noext?: boolean;
    nonegate?: boolean;
    noglobstar?: boolean;
    unescape?: boolean;
}
export type SingleGlob = string;
export type MultiGlob = SingleGlob[];

export interface CustomizedGlob {
    pattern: (
        | SingleGlob
        | MultiGlob
    );
    options?: GlobOptions;
}

export type GlobInput = (
    | SingleGlob
    | CustomizedGlob
    | (SingleGlob | CustomizedGlob)[]
);

export interface GlobResolver {
    input: GlobInput;
    options?: GlobOptions;
    output: string;
}

export interface ExplicitGlobResolver extends GlobResolver {
    input: SingleGlob;
    options: GlobOptions;
    output: string;
}

export type GlobResolverConfig = (
    | GlobResolver
    | GlobResolver[]
);