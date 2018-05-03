import { GlobResolverConfig } from './config.jsonSchema';

const t1: GlobResolverConfig = {
    input: '${workspaceFolder}/src/**/*.ts',
    output: '${workspaceFolder}/bin/${glob:0}/${glob:1}.js'
};

const t2: GlobResolverConfig = {
    input: [
        '${workspaceFolder}/src/**/*.ts'
    ],
    output: '${workspaceFolder}/bin/${glob:0}/${glob:1}.js'
};

const t3: GlobResolverConfig = {
    input: [
        {
            pattern: '${workspaceFolder}/src/**/*.ts',
            options: {
                dot: false
            }
        },
        '${workspaceFolder}/src/components/**/*.ts'
    ],
    output: '${workspaceFolder}/bin/${glob:0}/${glob:1}.js'
};
