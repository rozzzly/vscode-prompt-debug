import { mergeOptions, defaultOptions } from './config';
import { UNDEFINED_KEYWORD } from './schema';

describe('merging GlobOptions flags with mergeOptions', () => {
    it('gives default GlobOptions when nothing is passed to it', () => {
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

describe('merging GlobOptions.ignore with mergeOptions', () => {
    describe('the `undefined` caveat', () => {
        it('gives default of `undefined` when nothing is passed to it', () => {
            expect(defaultOptions.ignore).toEqual(undefined);
            const opts = mergeOptions();
            expect(opts.ignore).toEqual(undefined);
        });
        it('does not change from a previous value to `undefined` when right most value for `ignore` is `undefined` (explicitly specified)', () => {
            const opts = mergeOptions({
                ignore: 'foo'
            }, {
                ignore: undefined
            });
            expect(opts.ignore).toEqual('foo');
        });
        it('does not change from a previous value to `undefined` when `ignore` is omitted (implicitly specified)', () => {
            const opts = mergeOptions({
                ignore: 'foo'
            }, { }, {
                dot: true
            });
            expect(opts.ignore).toEqual('foo');
        });
        it('does revert from a previous value to `undefined` when the magic keyword `@@UNDEFINED` is specified', () => {
            const opts = mergeOptions({
                ignore: 'foo'
            }, {
                ignore: UNDEFINED_KEYWORD
            });
            expect(opts.ignore).toEqual(undefined);
        });
    });
});
