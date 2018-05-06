import { GlobResolverConfig } from './config';
import { validateGlobResolver } from '../../configSchema/validator';

describe('GlobResolverConfig', () => {
    it('allows a lone GlobResolver with a SingleGlob for a GlobInput', () => {
        const parsed: GlobResolverConfig = {
            input: '${workspaceFolder}/src/**/*.ts',
            output: '${workspaceFolder}/bin/${glob:0}/${glob:1}.js'
        };
        const validated = validateGlobResolver(parsed);
        expect(validated).toBeTruthy();
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

