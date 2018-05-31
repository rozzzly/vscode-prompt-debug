import { objLookup } from './config';

describe('objLookup', () => {
    const obj = {
        dot: {
            joined: {
                paths: 'success'
            }
        }
    };
    describe('traversal behavior', () => {
        it('takes complete dot.joined.paths to get leaf nodes of a deeply nested object', () => {
            expect(objLookup(obj, 'dot.joined.paths')).toEqual('success');
        });

        it('accepts partial dot.joined.paths to access (non-terminal/non-leaf) nodes of a nested object object', () => {
            const dot = objLookup(obj, 'dot');
            expect(dot).toEqual({ joined: { paths: 'success' }});

            it('can be run recursively on resulting non-terminal nodes to inspect deeper', () => {
                const joined = objLookup(dot, 'joined');
                expect(joined).toEqual({ paths: 'success' });
                expect(objLookup(joined, 'paths')).toEqual('success');
            });

            it('can of course still use dot.joined.paths when recursively inspecting non-terminal nodes', () => {
                expect(objLookup(dot, 'joined.paths')).toEqual('success');
            });
        });
    });
});