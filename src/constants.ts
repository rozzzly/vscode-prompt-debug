export const PREFIX = 'prompt-debug';

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////



export const CONFIG_IDs = {
    autoResolveScript: 'autoResolveScript'
};
export type CONFIG_ID_FRAGMENTS = keyof typeof CONFIG_IDs;

export const CONFIG_CANONICAL_IDs: {
    [K in CONFIG_ID_FRAGMENTS]: string
} = Object.keys(CONFIG_IDs).reduce(
    (reduction, key) => ({
        ...reduction,
        [key]: `${PREFIX}.${key}`
    }), {}
) as any;

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

export const COMMAND_IDs = {
    resolve: 'resolve',
    prompt: 'prompt',
    clearHistory: 'clearHistory',
    autoResolve: 'autoResolve'
};

export type COMMAND_ID_FRAGMENTS = keyof typeof COMMAND_IDs;

export const COMMAND_CANONICAL_IDs: {
    [K in COMMAND_ID_FRAGMENTS]: string
} = Object.keys(COMMAND_IDs).reduce(
    (reduction, key) => ({
        ...reduction,
        [key]: `${PREFIX}.${key}`
    }), {}
) as any;