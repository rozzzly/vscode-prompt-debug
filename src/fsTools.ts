import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs-extra-promise';
import { substitute } from './substitution';

export function getActiveFile(): string | null {
    if (vscode.window.activeTextEditor) {
        return vscode.window.activeTextEditor.document.uri.fsPath;
    } else {
        return null;
    }
}
export function getActiveFileUri(): vscode.Uri | null {
    if (vscode.window.activeTextEditor) {
        return vscode.window.activeTextEditor.document.uri;
    } else {
        return null;
    }
}

export type LooseUri = string | vscode.Uri;

export async function toUri(value: LooseUri): Promise<vscode.Uri> {
    if (typeof value === 'string') {
        return vscode.Uri.file(await substitute(value));
    } else {
        return value;
    }
}

export async function toPath(value: LooseUri): Promise<string> {
    if (typeof value === 'string') {
        return substitute(value);
    } else {
        return value.fsPath;
    }
}

export async function relative(filePath: LooseUri, dirPath: LooseUri): Promise<string>;
export async function relative(_filePath: LooseUri, _dirPath: LooseUri): Promise<string> {
    const filePath = await toPath(_filePath);
    const dirPath = await toPath(_dirPath);
    return path.relative(filePath, dirPath);
}

export const areWorkspacesDefined = (): boolean => vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0;
export const areWorkspacesSupported = (): boolean => 'workspaceFolders' in vscode.workspace; // TODO ::: test on old vscode && new vscode with NO workspace
export function getWorkspaceFolderUri(): vscode.Uri | null;
export async function getWorkspaceFolderUri(filePath: LooseUri): Promise<vscode.Uri | null>;
export function getWorkspaceFolderUri(_filePath?: LooseUri): vscode.Uri | null | Promise<vscode.Uri | null> {
    if (areWorkspacesSupported() && areWorkspacesDefined()) {
        if (_filePath) {
            return new Promise(async resolve => {
                const expanded = await toPath(_filePath); // expand out here so `isDescendent` doesn't need to substitution on every iteration
                for (const workspace of vscode.workspace.workspaceFolders) {
                    if (await isDescendent(expanded, workspace.uri)) {
                        resolve(workspace.uri);
                        break;
                    }
                }
            });
        } else {
            return vscode.workspace.workspaceFolders[0].uri;
        }
    } else if (vscode.workspace.rootPath) {
        if (_filePath) {
            return new Promise(async resolve => (
                resolve((await isDescendent(_filePath, vscode.workspace.rootPath)) ? vscode.Uri.file(vscode.workspace.rootPath) : null)
            ));
        } else {
            return vscode.Uri.file(vscode.workspace.rootPath);
        }
    } else {
        return null;
    }
}

export function getWorkspaceFolderPath(): string | null;
export async function getWorkspaceFolderPath(filePath: LooseUri): Promise<string | null>;
export function getWorkspaceFolderPath(_filePath?: LooseUri): string | null | Promise<string | null> {
    if (_filePath) {
        return getWorkspaceFolderUri(_filePath).then(uri => uri.fsPath);
    } else {
        return getWorkspaceFolderUri().fsPath;
    }
}


export async function locateUri(filePath: string): Promise<vscode.Uri| null> {
    const expanded = await toUri(filePath);
    return (await exists(expanded)) ? expanded : null;
}
export async function locatePath(filePath: string): Promise<string | null> {
    const expanded = await toUri(filePath);
    return (await exists(expanded)) ? expanded.fsPath : null;
}

export async function lastModified(filePath: LooseUri): Promise<number> {
    return (await fs.statAsync(await toPath(filePath))).mtimeMs;
}

export async function fileExists(filePath: LooseUri): Promise<boolean> {
    try {
        return (await fs.statAsync(await toPath(filePath))).isFile();
    } catch (e) {
        return false;
    }
}

export async function dirExists(dirPath: LooseUri): Promise<boolean> {
    try {
        return (await fs.statAsync(await toPath(dirPath))).isDirectory();
    } catch (e) {
        return false;
    }
}

export async function exists(path: LooseUri): Promise<boolean>;
export async function exists(_path: LooseUri): Promise<boolean> {
    try {
        return !!(await fs.statAsync(await toPath(_path)));
    } catch (e) {
        return false;
    }
}

export async function isDescendent(filePath: LooseUri, parentDir: LooseUri): Promise<boolean>;
export async function isDescendent(_filePath: LooseUri, _parentDir: LooseUri): Promise<boolean> {
    const filePath = await toPath(_filePath);
    const parentDir = await toPath(_parentDir);
    const caseInsensitive = process.platform === 'win32';
    const filePathParts = path.normalize(caseInsensitive ? filePath.toLocaleLowerCase() : filePath).split(path.sep);
    const parentDirParts = path.normalize(caseInsensitive ? parentDir.toLocaleLowerCase() : parentDir).split(path.sep);

    if (parentDirParts.length > filePathParts.length) {
        return false;
    } else {
        for (let i = 0; i < parentDirParts.length; i++) {
            const filePathPart = filePathParts[i];
            const parentDirPart = parentDirParts[i];
            if (parentDirPart !== filePathPart) {
                return false;
            }
        }
        return true;
    }
}