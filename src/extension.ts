import * as vscode from 'vscode';

import { resolveToPath } from './fsTools';
import { COMMAND_CANONICAL_IDs } from './constants';
import { getActiveFilePath } from './compat';
import { findUserConfig } from './compat/config';
import { DisposableHandle } from './runtime';

import run from './runtime';

const CHOICE_TIMEOUT: number = 333;
const HISTORY_SIZE: number = 15;

export function log(...args: any[]) {
    console.log('%c⟪ vscode-prompt-debug ⟫', 'font-weight:bold;color:darkgreen;', ...args);
}
const launchChoice: {
    timestamp: number,
    file: string
} = {
    timestamp: 0,
    file: ''
};

interface HistoryRecord {
    file: string;
    lastUse: number;
    uses: number;
}

function updateHistory(context: vscode.ExtensionContext, file: string): void {
    const oldHistory = context.workspaceState.get<HistoryRecord[]>('history', []);
    let foundInHistory: boolean = false;
    const refreshedHistory: HistoryRecord[] = oldHistory.map(record => {
        if (record.file === file) {
            foundInHistory = true;
            return { ...record, lastUse: Date.now(), uses: record.uses + 1 }; // update stats
        } else return record; // no change
    }).sort((a, b) => b.lastUse - a.lastUse); // re-sort incase previously used item was selected and needs to be brought to the top

    // if it's brand new, then insert it at the top
    if (!foundInHistory) {
        refreshedHistory.unshift({
            file,
            uses: 1,
            lastUse: Date.now()
        });
     }
    log(refreshedHistory);
    // store update history
    context.workspaceState.update('history', refreshedHistory.slice(0, HISTORY_SIZE));
}

async function promptForFile(context: vscode.ExtensionContext): Promise<string> {
    const previousFiles: HistoryRecord[] = context.workspaceState.get<HistoryRecord[]>('history', []);
    const enterFileOption: vscode.QuickPickItem = {
        label: '------- Enter Path -------',
        description: '',
        detail: 'Enter a path (relative to the workspace root) to be targeted by the debug session.'
    };
    const activeFile = getActiveFilePath();
    const activeFileOption: vscode.QuickPickItem = {
        label: '------- Active File -------',
        detail: activeFile || '',
        description: ''
    };
    log('fileHistory', previousFiles);

    // setup list of options
    const options: vscode.QuickPickItem[] = [
        ...((activeFile)
            ? [
                enterFileOption,
                activeFileOption
            ] : [
                enterFileOption
            ]
        ),
        ...previousFiles.map<vscode.QuickPickItem>(record => ({
            label: vscode.workspace.asRelativePath(record.file),
            description: '',
            detail: record.file
        }))
    ]; // filter out active file option if no editor is open

    const chosen = await vscode.window.showQuickPick(options, { /**/ });
    if (chosen) {
        let potentialFile = chosen.detail;
        if (chosen === enterFileOption) {
            const result = await vscode.window.showInputBox({
                prompt: 'Path of file to launch debug session for.',
                value: previousFiles.length ? vscode.workspace.asRelativePath(previousFiles[0].file) : ''
            });
            if (result) potentialFile = result;
            else {
                throw new Error('User did not supply a file.');
            }
        }
        if (potentialFile) {
            const file = await resolveToPath(potentialFile);
            if (!file) {
                vscode.window.showErrorMessage('Could not find the specified file.');
                throw new URIError(`Could not find the specified file: '${potentialFile}'`);
            } else {
                updateHistory(context, file);
                return file;
            }
        } else {
            throw new Error('User did not make a choice.');
        }
    } else {
        throw new Error('User did not make a choice.');
    }
}

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand(COMMAND_CANONICAL_IDs.resolveViaPrompt, promptForFile));

    context.subscriptions.push(vscode.commands.registerCommand(COMMAND_CANONICAL_IDs.resolve, async (): Promise<string> => {
        // if choice is stale/no choice made, re-prompt user.
        if (!launchChoice.file || (Date.now() - launchChoice.timestamp) >= CHOICE_TIMEOUT) {
            const file = await promptForFile(context);
            launchChoice.file = file;
            launchChoice.timestamp = Date.now();
        }
        // if a legit choice was made, resolve with it
        if (launchChoice.file && (Date.now() - launchChoice.timestamp) < CHOICE_TIMEOUT) {
            return launchChoice.file;
        } else {
            vscode.window.showErrorMessage('Failed to choose a file to launch debug session for.');
            throw new URIError('Failed to choose a file to launch debug session for.');
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand(COMMAND_CANONICAL_IDs.clearHistory, () => {
        context.workspaceState.update('history', []);
    }));
    run(context);
}

export function deactivate(context: vscode.ExtensionContext) {
    context.subscriptions.forEach(sub => (sub as DisposableHandle).dispose(true));
}
