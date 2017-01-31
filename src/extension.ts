import * as vscode from 'vscode';
import * as fs from 'fs-extra-promise';
import * as path from 'path';

export const COMMAND_PREFIX = 'prompt-debug';
export const COMMAND_IDs = {
    resolve: `${COMMAND_PREFIX}.resolve`,
    prompt: `${COMMAND_PREFIX}.prompt`,
    clearHistory: `${COMMAND_PREFIX}.clearHistory`,
    launchForActiveFile: `${COMMAND_PREFIX}.launchSessionForActiveFile`,
};
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

function getActiveFile(): string | false {
    if (vscode.window.activeTextEditor) {
        return vscode.window.activeTextEditor.document.fileName;
    } else {
        return false;
    }
}

function updateHistory(context: vscode.ExtensionContext, file: string): void {
    const oldHistory = context.workspaceState.get<HistoryRecord[]>('history', []);
    let foundInHistory: boolean = false;
    const refreshedHistory: HistoryRecord[] = oldHistory.map(record => {
        if (record.file === file) {
            foundInHistory = true;
            return { ...record, lastUse: Date.now(), uses: record.uses + 1 }; // update stats
        } else return record; // no change
    }).sort((a, b) => a.lastUse - b.lastUse); // re-sort incase previously used item was selected and needs to be brought to the top
    /// TODO: ensure that ^ sort ^ direction isn't backwards

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
    const previousFiles = context.workspaceState.get<string[]>('history', []);
    const enterFileOption: vscode.QuickPickItem = {
        label: 'Enter Path',
        description: 'Enter a path (relative to the workspace root) to be targeted by the debug session.'
    };
    const activeFile = getActiveFile();
    const activeFileOption: vscode.QuickPickItem = {
        label: 'Current File',
        description: activeFile || ''
    };
    // setup list of options
    const options: vscode.QuickPickItem[] = [
        enterFileOption,
        activeFile ? activeFileOption : undefined,
        ...previousFiles.map<vscode.QuickPickItem>(file => ({
            label: vscode.workspace.asRelativePath(file),
            description: file
        }))
    ].filter(opt => !!opt); // filter out active file option if no editor is open

    const chosen = await vscode.window.showQuickPick(options, { /**/ });
    if (chosen) {
        let potentialFile: string = chosen.description;
        if (chosen === enterFileOption) {
            const result = await vscode.window.showInputBox({
                prompt: 'path of file to launch debug session for',
                value: previousFiles.length ? vscode.workspace.asRelativePath(previousFiles[0]) : ''
            });
            if (result) potentialFile = result;
            else {
                throw new Error('User did not supply a file.');
            }
        }
        const file = await locateFile(potentialFile);
        if (!file) {
            vscode.window.showErrorMessage('Could not find the specified file.');
            throw new URIError(`Could not find the specified file: '${file}'`);
        } else {
            return file;
        }
    } else {
        throw new Error('User did not make a choice.');
    }
}

async function locateFile(file: string): Promise<string | false> {
    if (path.isAbsolute(file)) return await fileExists(file) ? file : false;
    else {
        if (file.includes('${workspaceRoot}')) { // allow user to explicitly interpolate ${workspaceRoot}
            const substituted = file.replace('${workspaceRoot}', vscode.workspace.rootPath);
            return await fileExists(substituted) ? substituted : false;
        } else {
            const joined = path.join(vscode.workspace.rootPath, file); // assume user intended it to be relative to workspace root
            return await fileExists(joined) ? joined : false;
        }
    }
}

async function fileExists(file: string): Promise<boolean> {
    if (!file) return false;
    else {
        try {
            return (await fs.statAsync(file)).isFile();
        } catch (e) {
            return false;
        }
    }
}
export function activate(context: vscode.ExtensionContext) {

    log('extension started!');

    context.subscriptions.push(vscode.commands.registerCommand(COMMAND_IDs.resolve, async (): Promise<string> => {
        // if choice is stale/no choice made, re-prompt user.
        if (!launchChoice.file || (Date.now() - launchChoice.timestamp) >= CHOICE_TIMEOUT) {
            await vscode.commands.executeCommand<string>(COMMAND_IDs.prompt);
        }
        // if a legit choice was made, resolve with it
        if (launchChoice.file && (Date.now() - launchChoice.timestamp) < CHOICE_TIMEOUT) {
            return launchChoice.file;
        } else {
            vscode.window.showErrorMessage('Failed to choose a file to launch debug session for.');
            throw new URIError('Failed to choose a file to launch debug session for.');
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand(COMMAND_IDs.launchForActiveFile, async (): Promise<string> => {
        return '';
    }));
}

export function deactivate(context: vscode.ExtensionContext) {
    context.subscriptions.forEach(sub => sub.dispose());
}
