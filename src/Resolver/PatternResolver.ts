import { Substitution, defaultSubstitutions } from '../substitution';

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

export const getOptions = (opts: PatternOptions = {}): PatternOptions => ({
    ...defaultOptions,
    ...opts
});



export type BasicPattern = (
    | string
    | [
        string,
        PatternOptions
    ]
);

export type MultiPattern = (
    | string[]
    | [
        string, PatternOptions
    ][]
    | [
        string[], PatternOptions
    ]
);

export type Pattern = (
    | BasicPattern
    | MultiPattern
);

export interface PatternResolver {
    in: string;
    out: string;
}

const substitutions: Substitution[] = [
    ...defaultSubstitutions,
    substitutions(): derp {        
    }
]