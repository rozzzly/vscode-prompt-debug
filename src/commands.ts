import { ExtensionContext, commands } from 'vscode';

import { getHandleGroup, DisposableHandleGroup } from './runtime';
import { COMMAND_CANONICAL_IDs as cmdIDs } from './constants';

import resolveViaGlob from './Resolver/GlobResolver/command';
import resolveViaScript from './Resolver/ScriptResolver/command';

let handles: DisposableHandleGroup;

export const registerCmds = (ctx: ExtensionContext): void => {
    handles = getHandleGroup(
        ctx,
        commands.registerCommand(cmdIDs.resolveViaGlob, resolveViaGlob),
        /// TODO ::: add legacy cmd equivalent (if any)
        commands.registerCommand(cmdIDs.resolveViaScript, resolveViaScript)
        /// TODO ::: add legacy cmd equivalent (if any)
    );
};

export const disposeCmds = (): void => (
    handles.dispose()
);