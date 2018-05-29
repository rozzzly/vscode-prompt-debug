export type UNDEFINED_KEYWORD = '@@[UNDEFINED]';
export const UNDEFINED_KEYWORD: UNDEFINED_KEYWORD = '@@[UNDEFINED]';
export type INHERITS_KEYWORD = '@@[INHERIT]';
export const INHERITS_KEYWORD: INHERITS_KEYWORD = '@@[INHERIT]';

export interface GlobOptions {
    /**
     * @default false
     */
    basename: boolean;
    /**
     * @default true
     */
    bash: boolean;
    /**
     * @default false
     */
    dot: boolean;
    /**
     * @default undefined
     */
    ignore: string | string[] | undefined;
    /**
     * @default false
     */
    nobrace: boolean;
    /**
     * @default false
     */
    nocase: boolean;
    /**
     * @default false
     */
    noext: boolean;
    /**
     * @default false
     */
    nonegate: boolean;
    /**
     * @default false
     */
    noglobstar: boolean;
    /**
     * @default false
     */
    unescape: boolean;
}

export type PartialGlobOptions = Partial<GlobOptions>;

export type SingleGlob = string;
export type MultiGlob = SingleGlob[];

export interface CustomizedGlob {
    pattern: (
        | SingleGlob
        | MultiGlob
    );
    options?: PartialGlobOptions;
}

export type GlobInput = (
    | SingleGlob
    | CustomizedGlob
    | (SingleGlob | CustomizedGlob)[]
);

export interface GlobResolver {
    input: GlobInput;
    options?: PartialGlobOptions;
    output: string;
}

export type GlobResolverConfig = (
    | GlobResolver
    | GlobResolver[]
);