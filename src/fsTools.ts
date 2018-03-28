import * as vscode from 'vscode';
import * as nodeJsPath from 'path';
import * as fs from 'fs-extra-promise';

export function getActiveFile(): string | false {
    if (vscode.window.activeTextEditor) {
        return vscode.window.activeTextEditor.document.fileName;
    } else {
        return false;
    }
}

export type LooseUri = string | vscode.Uri;

export function tightenToUri(value: LooseUri): vscode.Uri {
    if (typeof value === 'string') {
        return vscode.Uri.file(value);
    } else {
        return value;
    }
}

export function tightenToString(value: LooseUri): string {
    if (typeof value === 'string') {
        return value;
    } else {
        return value.fsPath;
    }
}

// const areWorkspacesSupported: boolean = 'workspaceFolders' in vscode.workspace;

// export function workspaceRoot(): vscode.Uri | false {
//     if (!areWorkspacesSupported || !vscode.workspace.workspaceFolders || !vscode.workspace.workspaceFolders.length) {
//         return (vscode.workspace.rootPath) ? vscode.workspace.rootPath : false;
//     } else {
//         return vscode.workspace.workspaceFolders[0].uri;
//     }
    
// }

// export interface dissectedFilePath {
//     isDescendantOfRootDir: boolean;

// }

// export function dissectFilePath(filePath: string, rootDir: string): {} {

// }

export interface PathExpander {
    pattern: (
        | string
        | RegExp
    );
    replacer: (
        | (() => string)
        | (() => Promise<string>)
    );
}

/// TODO ::: expand all types of variables and commands like tasks.json
/// @see https://sourcegraph.com/github.com/Microsoft/vscode/-/blob/src/vs/workbench/parts/debug/electron-browser/debugConfigurationManager.ts#L600:23
export function expandPath(path: string): string {
    const tight = tightenToString(path);
    if (nodeJsPath.isAbsolute(tight)) return tight;
    else {
        if (tight.includes('${workspaceRoot}')) { // allow user to interpolate ${workspaceRoot}
            return tight.replace('${workspaceRoot}', vscode.workspace.rootPath);
        } else {
            return nodeJsPath.join(vscode.workspace.rootPath, tight); // assume user intended it to be relative to workspace root
        }
    }
}

export async function locate(filePath: LooseUri): Promise<string | false> {
    const tight = tightenToString(filePath);
    const expanded = expandPath(tight);
    return await exists(expanded) ? expanded : false;
}

export async function locateFile(filePath: string): Promise<string | false> {
    const tight = tightenToString(filePath);
    const expanded = expandPath(tight);
    return await exists(expanded) ? expanded : false;
}

export async function lastModified(filePath: LooseUri): Promise<number> {
    const stats = await fs.statAsync(tightenToString(filePath));
    return stats.mtimeMs;
}

export async function fileExists(filePath: string): Promise<boolean> {
    const tight = tightenToString(filePath);
    if (!tight) return false;
    else {
        const expanded = expandPath(tight);
        try {
            return (await fs.statAsync(expanded)).isFile();
        } catch (e) {
            return false;
        }
    }
}

export async function dirExists(dirPath: string): Promise<boolean> {
    const tight = tightenToString(dirPath);
    if (!tight) return false;
    else {
        const expanded = expandPath(tight);
        try {
            return (await fs.statAsync(expanded)).isDirectory();
        } catch (e) {
            return false;
        }
    }
}

export async function exists(path: string): Promise<boolean> {
    const tight = tightenToString(path);
    if (!path) return false;
    else {
        const expanded = expandPath(path);
        try {
            return !!(await fs.statAsync(expanded));
        } catch (e) {
            return false;
        }
    }
}

export function isDescendent(path: string, parentDir: string): boolean {
    const tightPath = tightenToString(path);
    const tightParent = tightenToString(parentDir);
    // make sure that case-insensitive paths are accounted for when running on windows
    const caseInsensitive = process.platform === 'win32';
    const absPath = ((nodeJsPath.isAbsolute(tightPath))
        ? ((caseInsensitive)
            ? tightPath.toLocaleLowerCase()
            : tightPath
          )
        : ((caseInsensitive)
            ? nodeJsPath.resolve(tightPath).toLocaleLowerCase()
            : nodeJsPath.resolve(tightPath)
        )
    );
    const absParent = ((nodeJsPath.isAbsolute(tightParent))
        ? ((caseInsensitive)
            ? tightParent.toLocaleLowerCase()
            : tightParent
          )
        : ((caseInsensitive)
            ? nodeJsPath.resolve(tightParent).toLocaleLowerCase()
            : nodeJsPath.resolve(tightParent)
        )
    );

    return absPath.startsWith(absParent);
}