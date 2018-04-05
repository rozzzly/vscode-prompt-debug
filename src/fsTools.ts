import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs-extra-promise';
import { substitute } from './substitution';

export function getActiveFile(): string | false {
    if (vscode.window.activeTextEditor) {
        return vscode.window.activeTextEditor.document.uri.fsPath;
    } else {
        return false;
    }
}
export function getActiveFileUri(): vscode.Uri | false {
    if (vscode.window.activeTextEditor) {
        return vscode.window.activeTextEditor.document.uri;
    } else {
        return false;
    }
}

export type LooseUri = string | vscode.Uri;

export function toUri(value: LooseUri): vscode.Uri {
    if (typeof value === 'string') {
        return vscode.Uri.file(value);
    } else {
        return value;
    }
}

export function toString(value: LooseUri): string {
    if (typeof value === 'string') {
        return value;
    } else {
        return value.fsPath;
    }
}

export function relative(filePath: LooseUri, dirPath: LooseUri): string;
export function relative(_filePath: LooseUri, _dirPath: LooseUri): string {
    const filePath = toString(_filePath);
    const dirPath = toString(_dirPath);
    return path.relative(filePath, dirPath);
}

export const areWorkspacesDefined = (): boolean => vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0;
export const areWorkspacesSupported = (): boolean => 'workspaceFolders' in vscode.workspace;


export async function locate(filePath: LooseUri): Promise<string | false> {
    const tight = toString(filePath);
    const expanded = await substitute(tight);
    return await exists(expanded) ? expanded : false;
}

export async function locateFile(filePath: LooseUri): Promise<string | false> {
    const tight = toString(filePath);
    const expanded = await substitute(tight);
    return await exists(expanded) ? expanded : false;
}

export async function lastModified(filePath: LooseUri): Promise<number> {
    const stats = await fs.statAsync(toString(filePath));
    return stats.mtimeMs;
}

export async function fileExists(filePath: LooseUri): Promise<boolean> {
    const tight = toString(filePath);
    if (!tight) return false;
    else {
        const expanded = await substitute(tight);
        try {
            return (await fs.statAsync(expanded)).isFile();
        } catch (e) {
            return false;
        }
    }
}

export async function dirExists(dirPath: LooseUri): Promise<boolean> {
    const tight = toString(dirPath);
    if (!tight) return false;
    else {
        const expanded = await substitute(tight);
        try {
            return (await fs.statAsync(expanded)).isDirectory();
        } catch (e) {
            return false;
        }
    }
}

export async function exists(path: LooseUri): Promise<boolean>;
export async function exists(_path: LooseUri): Promise<boolean> {
    const tight = toString(_path);
    if (!tight) return false;
    else {
        const expanded = await substitute(tight);
        try {
            return !!(await fs.statAsync(expanded));
        } catch (e) {
            return false;
        }
    }
}

export function isDescendent(filePath: LooseUri, parentDir: LooseUri): boolean;
export function isDescendent(_filePath: LooseUri, _parentDir: LooseUri): boolean {
    const filePath = toString(_filePath);
    const parentDir = toString(_parentDir);
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