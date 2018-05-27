export const DISPLAY_NAME: '[[ prompt-debug ]]' = '[[ prompt-debug ]]';
export const PREFIX: 'prompt-debug' = 'prompt-debug';

export const REJECTED: unique symbol = Symbol('RuntimeHint/REJECTED'); /// TODO ::: namespace this
export type REJECTED = typeof REJECTED;

export const NO_ARG: unique symbol = Symbol('RuntimeHint/NO_ARG'); /// TODO ::: namespace this
export type NO_ARG = typeof NO_ARG;

export const SOFT_REJECTION: unique symbol = Symbol('RuntimeHint/SOFT_REJECTION'); /// TODO ::: namespace this
export type SOFT_REJECTION = typeof SOFT_REJECTION;

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

export const CONFIG_IDs = {
    scriptResolver: 'scriptResolver',
    globResolver: 'globResolver'
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
    clearHistory: 'clearHistory',
    resolveViaGlob: 'resolveViaGlob',
    resolveViaScript: 'resolveViaScript',
    resolveViaPrompt: 'resolveViaPrompt'
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