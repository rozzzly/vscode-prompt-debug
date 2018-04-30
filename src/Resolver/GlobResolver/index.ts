import { Substitution, defaultSubstitutions } from '../../substitution';

export interface PatternContext {
    glob: string[];
}

const globSubstitutions: Substitution<PatternContext>[] = [
    ...defaultSubstitutions,
    {
        pattern: /glob:(\d+)/,
        resolver(ctx, indexStr): string {
            const index = Number.parseInt(indexStr);
            if (typeof index === 'number' && index >= 0 && index < ctx.data.glob.length) {
                return ctx.data.glob[index];
            } else {
                throw new RangeError('Glob index out of range!');
            }

        }
    },
    {
        pattern: /glob\:count/,
        resolver(ctx): string {
            return String(ctx.data.glob.length);
        }
    }
];