import * as path from 'path';
import * as fs from 'fs-extra-promise';
import * as vscode from 'vscode';
import { workspace, Uri, window as vsWindow } from 'vscode';
import { substitute } from './substitution';
import { POINT_CONVERSION_COMPRESSED } from 'constants';
import { isMultiRootSupported, isCaseInsensitive } from './compat';

export function getActiveFilePath(): string | null {
    if (vsWindow.activeTextEditor) {
        return vsWindow.activeTextEditor.document.uri.fsPath;
    } else {
        return null;
    }
}
export function getActiveFileUri(): Uri | null {
    if (vsWindow.activeTextEditor) {
        return vsWindow.activeTextEditor.document.uri;
    } else {
        return null;
    }
}

export type LooseUri = string | Uri;

export async function toUri(value: LooseUri): Promise<Uri> {
    if (typeof value === 'string') {
        return substitute(value).then((v) => Uri.file(v));
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

export async function relative(resource: LooseUri, base: LooseUri): Promise<string>;
export async function relative(_resource: LooseUri, _base: LooseUri): Promise<string> {
    const resource = await toPath(_resource);
    const base = await toPath(_base);
    return path.relative(resource, base);
}

export async function resolveToUri(resource: string): Promise<Uri | null> {
    const uri = await toUri(resource);
    return (await exists(uri)) ? uri : null;
}
export async function resolveToPath(resource: string): Promise<string | null> {
    const uri = await resolveToUri(resource);
    return uri ? uri.fsPath : null;
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
        return !!await fs.statAsync(await toPath(resource));
    } catch (e) {
        return false;
    }
}

export async function isDescendent(resource: LooseUri, base: LooseUri): Promise<boolean>;
export async function isDescendent(_resource: LooseUri, _base: LooseUri): Promise<boolean> {
    const resource = await toPath(_resource);
    const base = await toPath(_base);

    const resourceParts = path.normalize(isCaseInsensitive ? resource.toLocaleLowerCase() : resource).split(path.sep);
    const baseParts = path.normalize(isCaseInsensitive ? base.toLocaleLowerCase() : base).split(path.sep);

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
