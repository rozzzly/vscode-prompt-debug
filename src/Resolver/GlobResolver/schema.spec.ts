import { GlobResolverConfig, GlobOptions } from './schema';
import { validateGlobResolverConfig  } from '../../configSchema/validator';

describe('GlobResolverConfig', () => {
    it('allows a lone GlobResolver with a SingleGlob for a GlobInput', () => {
        const parsed: GlobResolverConfig = {
            input: '${workspaceFolder}/src/**/*.ts',
            output: '${workspaceFolder}/bin/${glob:0}/${glob:1}.js'
        };
        const validated = validateGlobResolverConfig(parsed);
        expect(validated).not.toBeNull();
    });
    it('allows a lone GlobResolver with a CustomizedGlob for a GlobInput that specifies no GlobOptions', () => {
        const parsed: GlobResolverConfig = {
            input: {
                pattern: '${workspaceFolder}/src/**/*.ts'
            },
            output: '${workspaceFolder}/bin/${glob:0}/${glob:1}.js'
        };
        const validated = validateGlobResolverConfig(parsed);
        expect(validated).not.toBeNull();
    });
    it('allows a lone GlobResolver with a CustomizedGlob for a GlobInput that does specify GlobOptions', () => {
        const parsed: GlobResolverConfig = {
            input: {
                pattern: '${workspaceFolder}/src/**/*.ts',
                options: {
                   noext: false
                }
            },
            output: '${workspaceFolder}/bin/${glob:0}/${glob:1}.js'
        };
        const validated = validateGlobResolverConfig(parsed);
        expect(validated).not.toBeNull();
    });
    it('does not allow GlobOptions to specify unknown options', () => {
        const parsed: GlobResolverConfig = {
            input: {
                pattern: '${workspaceFolder}/src/**/*.ts',
                options: {
                   foo: 'bar'
                }
            },
            output: '${workspaceFolder}/bin/${glob:0}/${glob:1}.js'
        } as any;
        const validated = validateGlobResolverConfig(parsed);
        expect(validated).toBeNull();
    });
});

// // const t2: GlobResolverConfig = {
//     input: [
//         '${workspaceFolder}/src/**/*.ts'
//     ],
//     output: '${workspaceFolder}/bin/${glob:0}/${glob:1}.js'
// };

// const t3: GlobResolverConfig = {
//     input: [
//         {
//             pattern: '${workspaceFolder}/src/**/*.ts',
//             options: {
//                 dot: false
//             }
//         },
//         '${workspaceFolder}/src/components/**/*.ts'
//     ],
//     output: '${workspaceFolder}/bin/${glob:0}/${glob:1}.js'
// };

