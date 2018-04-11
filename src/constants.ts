export const PREFIX = 'prompt-debug';

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

export const CONFIG_ID_FRAGMENTS = {
    autoResolveScript: 'autoResolveScript'
};
export const CONFIG_IDs: {
    [K in keyof typeof CONFIG_ID_FRAGMENTS]: string
} = Object.keys(CONFIG_ID_FRAGMENTS).reduce(
    (reduction, value, key) => ({
        ...reduction,
        [key]: `${PREFIX}.${key}`
    }), {}
) as any;

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

export const COMMAND_ID_FRAGMENTS = {
    resolve: 'resolve',
    prompt: 'prompt',
    clearHistory: 'clearHistory',
    autoResolve: 'autoResolve'
};

export const COMMAND_IDs: {
    [K in keyof typeof COMMAND_ID_FRAGMENTS]: string
} = Object.keys(COMMAND_ID_FRAGMENTS).reduce(
    (reduction, value, key) => ({
        ...reduction,
        [key]: `${PREFIX}.${key}`
    }), {}
) as any;