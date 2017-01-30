import * as vscode from 'vscode';
import * as fs from 'fs-extra-promise';

export const COMMAND_PREFIX = 'prompt-debug';
export const COMMAND_IDs = {
    resolve: `${COMMAND_PREFIX}.resolve`,
    prompt: `${COMMAND_PREFIX}.prompt`,
    launchForCurrentFile: `${COMMAND_PREFIX}.launchSessionForCurrentFile`,
};


export function log(...args: any[]) {
    console.log('%c⟪ vscode-prompt-debug ⟫', 'font-weight:bold;color:darkgreen;', ...args);
}

const launchOption: {
    timestamp: number,
    file: string
} = {
    timestamp: 0,
    file: ''
};

function getActiveFile(): string | false {
    if (vscode.window.activeTextEditor) {
        return vscode.window.activeTextEditor.document.fileName;
    } else {
        return false;
    }
}

async function promptForFile(context: vscode.ExtensionContext): Promise<string> {
    const previousFiles = context.workspaceState.get<string[]>('history', []);
    const promptOption: vscode.QuickPickItem = {
        label: 'Enter Path',
        description: 'Enter a path (relative to the workspace root) to be targeted by the debug session.'
    };
    const activeFile = getActiveFile();
    const currentFileOption: vscode.QuickPickItem = {
        label: 'Current File',
        description: activeFile || ''
    };

    let options: vscode.QuickPickItem[] = [promptOption];
    options = [...options, currentFileOption];
    options = [...options, ...previousFiles.map<vscode.QuickPickItem>(file => ({
        label: file, description: ''

    }))];
    const chosen = await vscode.window.showQuickPick(options, {})
    return Promise.resolve('');
}



export function activate(context: vscode.ExtensionContext) {

    log('extension started!');

    context.subscriptions.push(vscode.commands.registerCommand(COMMAND_IDs.resolve, async (): Promise<string> => {
        if (launchOption.file && (Date.now() - launchOption.timestamp) < 333) {
            return '';
        } else {
            const file: string = await vscode.commands.executeCommand<string>(COMMAND_IDs.prompt);
            return
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand(COMMAND_IDs.launchForCurrentFile, async (): Promise<string> => {

    }));
}

export function deactivate(context: vscode.ExtensionContext) {
    context.subscriptions.forEach(sub => sub.dispose());
}
