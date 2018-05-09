import { mergeOptions, defaultOptions } from './config';

describe('mergeOptions', () => {
    it('gives default GlobOptions when no other options are passed', () => {
        const opts = mergeOptions();
        expect(opts).toEqual(defaultOptions);
    });
    it('allows passed a Partial<GlobOptions> to overwrite defaults', () => {
        expect(defaultOptions.dot).toEqual(false);
        const opts = mergeOptions({
            dot: true
        });
        expect(opts.dot).toEqual(true);
    });
    it('uses the right most value when multiple Partial<GlobOptions> contain the same value', () => {
        expect(defaultOptions.dot).toEqual(false);
        const opts = mergeOptions({
            dot: true
        }, {
            dot: false
        });
        expect(opts.dot).toEqual(false);
    });
});