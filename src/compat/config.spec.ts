import { objLookup } from './config';

describe('objLookup', () => {
    const obj = {
        dot: {
            joined: {
                paths: {
                    are: 'fun'
                }
            }
        }
    };
    describe('traversal behavior', () => {
        it('takes complete dot.joined.paths to get terminal nodes of a deeply nested object', () => {
            expect(objLookup(obj, 'dot.joined.paths.are')).toEqual('fun');
        });

        describe('recursive traversal', () => {
            const dot = objLookup(obj, 'dot');

            it('can be run recursively on non-terminal nodes to inspect deeper', () => {
                const joined = objLookup(dot, 'joined');
                expect(joined).toEqual({ paths: { are: 'fun' } });
                const paths = objLookup(joined, 'paths');
                expect(paths).toEqual({ are: 'fun'});
                expect(objLookup(paths, 'are')).toEqual('fun');
            });
            it('accepts partial dot.joined.paths to to traverse multiple non-terminal nodes', () => {
                expect(objLookup(dot, 'joined.paths')).toEqual({ are: 'fun'});
            });
            it('can use complete dot.joined.paths to access terminal nodes', () => {
                expect(objLookup(dot, 'joined.paths.are')).toEqual('fun');
            });
        });
    });
});
