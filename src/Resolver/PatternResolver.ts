import { Substitution, defaultSubstitutions } from '../substitution';
import { ExecSyncOptionsWithBufferEncoding } from 'child_process';

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

export const getOptions = (opts: PatternOptions = {}, ...inherits: PatternOptions[]): PatternOptions => ({
    ...defaultOptions,
    ...opts
});

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

    output: string;
}

export interface SubstitutionPatternContext extends Array<string> {

}

const substitutions: Substitution<SubstitutionPatternContext>[] = [
    ...defaultSubstitutions,
    {
        pattern: /glob:(\d+)/,
        resolver(ctx, indexStr): string {
            const index = Number.parseInt(indexStr);
            if (typeof index === 'number' && index >= 0 && index < ctx.data.length) {
                return ctx.data[index];
            } else {
                throw new RangeError('Glob index out of range!');
            }

        }
    },
    {
        pattern: /glob\:count/,
        resolver(ctx): string {
            return String(ctx.data.length);
        }
    }
];