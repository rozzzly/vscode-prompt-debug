import { defaultSubstitutions } from '../../substitution/definitions';
import { Substitution } from '../../substitution/api';

export interface OutputPatternContext {
    captures: string[];
}

export const globSubstitutions: Substitution<OutputPatternContext>[] = [
    ...defaultSubstitutions,
    {
        identifier: 'capture',
        pattern: /capture:(\d+)/,
        resolver(ctx, indexStr: string): string {
            const index = Number.parseInt(indexStr);
            if (typeof index === 'number' && index >= 0 && index < ctx.data.captures.length) {
                return ctx.data.captures[index];
            } else {
                throw new RangeError('Glob index out of range!');
            }

        }
    },
    {
        /// TODO ::: think of a case where this might be useful?
        identifier: 'captureCount',
        pattern: /capture:count(NonEmpty)?/,
        resolver: (ctx, nonEmpty: string | undefined): string => (
            String((nonEmpty)
                ? ctx.data.captures.filter(c => !!c).length
                : ctx.data.captures.length
            )
        )
    }
];