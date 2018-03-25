import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs-extra-promise';

export function getActiveFile(): string | false {
    if (vscode.window.activeTextEditor) {
        return vscode.window.activeTextEditor.document.fileName;
    } else {
        return false;
    }
}

/// TODO ::: expand all types of variables and commands like tasks.json
/// @see https://sourcegraph.com/github.com/Microsoft/vscode/-/blob/src/vs/workbench/parts/debug/electron-browser/debugConfigurationManager.ts#L600:23
export function expandPath(file: string): string {
    if (path.isAbsolute(file)) return file;
    else {
        if (file.includes('${workspaceRoot}')) { // allow user to interpolate ${workspaceRoot}
            return file.replace('${workspaceRoot}', vscode.workspace.rootPath);
        } else {
            return path.join(vscode.workspace.rootPath, file); // assume user intended it to be relative to workspace root
        }
    }
}

export async function locateFile(file: string): Promise<string | false> {
    const expanded = expandPath(file);
    return await fileExists(expanded) ? expanded : false;
}

export async function fileExists(file: string): Promise<boolean> {
    if (!file) return false;
    else {
        const expanded = expandPath(file);
        try {
            return (await fs.statAsync(expanded)).isFile();
        } catch (e) {
            return false;
        }
    }
}