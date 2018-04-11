import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs-extra-promise';
import { substitute } from './substitution';
import { workspace } from 'vscode';
import { POINT_CONVERSION_COMPRESSED } from 'constants';
import { isMultiRootSupported } from './compat';

export function getActiveFilePath(): string | null {
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

export function toUri(value: vscode.Uri): vscode.Uri;
export async function toUri(value: LooseUri): Promise<vscode.Uri>;
export function toUri(value: LooseUri): Promise<vscode.Uri> | vscode.Uri {
    if (typeof value === 'string') {
        return substitute(value).then(v => vscode.Uri.file(v));
    } else {
        return value;
    }
}

export function toPath(value: vscode.Uri): string;
export async function toPath(value: LooseUri): Promise<string>;
export function toPath(value: LooseUri): Promise<string> | string {
    if (typeof value === 'string') {
        return substitute(value);
    } else {
        return value.fsPath;
    }
}

export function relative(resource: vscode.Uri, base: vscode.Uri): string;
export async function relative(resource: LooseUri, base: LooseUri): Promise<string>;
export function relative(_resource: LooseUri, _base: LooseUri): string | Promise<string> {
    if (typeof _resource === 'string' || typeof _base === 'string') {
        return (async () => {
            const resource = await toPath(_resource);
            const base = await toPath(_base);
            return path.relative(resource, base);
        })();
    } else {
        return path.relative(_resource.fsPath, _base.fsPath);
    }
}

export async function resolveToUri(resource: string): Promise<vscode.Uri| null> {
    const uri = await toUri(resource);
    return (await exists(uri)) ? uri : null;
}
export async function resolveToPath(resource: string): Promise<string | null> {
    const uri = await resolveToUri(resource);
    return (uri) ? uri.fsPath : null;
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

export async function exists(resource: LooseUri): Promise<boolean> {
    try {
        return !!(await fs.statAsync(await toPath(resource)));
    } catch (e) {
        return false;
    }
}

export function isDescendent(resource: vscode.Uri, base: vscode.Uri): boolean;
export async function isDescendent(resource: LooseUri, base: LooseUri): Promise<boolean>;
export function isDescendent(_resource: LooseUri, _base: LooseUri): boolean | Promise<boolean> {
    if (typeof _resource === 'string' || typeof _base === 'string') {
        return (async() => {
            const resource = await toPath(_resource);
            const base = await toPath(_base);
            const caseInsensitive = process.platform === 'win32';
            const resourceParts = path.normalize(caseInsensitive ? resource.toLocaleLowerCase() : resource).split(path.sep);
            const baseParts = path.normalize(caseInsensitive ? base.toLocaleLowerCase() : base).split(path.sep);

            if (baseParts.length > resource.length) {
                return false;
            } else {
                for (let i = 0; i < baseParts.length; i++) {
                    const resourcePart = resourceParts[i];
                    const basePart = baseParts[i];
                    if (basePart !== resourcePart) {
                        return false;
                    }
                }
                return true;
            }
        })();
    } else {
        const resource = _resource.fsPath;
        const base = _base.fsPath;
        const caseInsensitive = process.platform === 'win32';
        const resourceParts = path.normalize(caseInsensitive ? resource.toLocaleLowerCase() : resource).split(path.sep);
        const baseParts = path.normalize(caseInsensitive ? base.toLocaleLowerCase() : base).split(path.sep);

        if (baseParts.length > resource.length) {
            return false;
        } else {
            for (let i = 0; i < baseParts.length; i++) {
                const resourcePart = resourceParts[i];
                const basePart = baseParts[i];
                if (basePart !== resourcePart) {
                    return false;
                }
            }
            return true;
        }
    }
}