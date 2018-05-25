import * as path from 'path';
import * as fs from 'fs-extra-promise';
import * as crypto from 'crypto';
import * as JSON6 from 'json-6';
import { homedir } from 'os';
import { workspace, Uri, window as vsWindow } from 'vscode';
import { substitute, containsSubstitution } from './substitution';
import { isMultiRootSupported, isCaseInsensitive } from './compat';


export const homeDirPath: string = homedir();
export const homeDirUri: Uri = Uri.file(homeDirPath);
export type LooseUri = string | Uri;

export function dropExt(resource: LooseUri, ext?: string): string;
export function dropExt(_resource: LooseUri, _ext?: string): string {
    const resource = asPath(_resource);
    const ext = ((_ext === undefined)
        ? path.extname(resource)
        : _ext
    );
    if (resource.endsWith(ext)) {
        return resource.slice(0, -1 * ext.length);
    } else {
        return resource;
    }
}

export async function resolveUri(value: LooseUri): Promise<Uri> {
    if (typeof value === 'string') {
        if (containsSubstitution(value)) {
            const subbed = await substitute(value);
            if (path.isAbsolute(subbed)) {
                return Uri.file(subbed);
            } else {
                throw new URIError('path MUST be absolute');
            }
        } else {
            if (path.isAbsolute(value)) {
                return Uri.file(value);
            } else {
                throw new URIError('path MUST be absolute');
            }
        }
    } else {
        return value;
    }
}

export async function resolvePath(resource: LooseUri): Promise<string> {
    return (await resolveUri(resource)).fsPath;
}

export const asPath = (resource: LooseUri): string => (
    ((typeof resource === 'string')
        ? resource
        : resource.fsPath
    )
);

export const basename = (resource: LooseUri, ext?: string): string => (
    path.basename(asPath(resource), ext)
);

export const relativePath = (resource: LooseUri, base: LooseUri): string => (
    path.relative(asPath(resource), asPath(base))
);

export async function resolveToUri(resource: string): Promise<Uri | null> {
    const uri = await resolveUri(resource);
    return (await exists(uri)) ? uri : null;
}
export async function resolveToPath(resource: string): Promise<string | null> {
    const uri = await resolveToUri(resource);
    return uri ? uri.fsPath : null;
}

export async function lastModified(filePath: Uri): Promise<number | null>;
export async function lastModified(filePath: Uri, suppressErrors: true): Promise<number | null>;
export async function lastModified(filePath: Uri, suppressErrors: false): Promise<number>;
export async function lastModified(filePath: Uri, suppressErrors: boolean = true): Promise<number| null> {
    return (await fs.statAsync(filePath.fsPath)).mtimeMs;
}


export function fileHash(resource: Uri): Promise<string | null>;
export function fileHash(resource: Uri, suppressErrors: true): Promise<string | null>;
export function fileHash(resource: Uri, suppressErrors: false): Promise<string>;
export function fileHash(resource: Uri, suppressErrors: boolean): Promise<string | null>;
export function fileHash(resource: Uri, suppressErrors: boolean = false): Promise<string | null> {
    return new Promise<string | null>((resolve, reject) => {
        try {
            const stream = fs.createReadStream(resource.fsPath);
            stream.on('error', e => {
                if (suppressErrors) {
                    reject(e);
                 } else {
                    console.error(e);
                    resolve(null);
                }
            });
            const hash = crypto.createHash('md5').setEncoding('hex');
            hash.on('finish', () => {
                /// TODO ::: investigate stream cleanup
                // stream.close();
                // stream.destroy();
                resolve(hash.read() as string);
            });
            stream.pipe(hash);
        } catch (e) {
            if (suppressErrors) {
                console.error(e);
                resolve(null);
            } else {
                reject(e);
            }
        }
    });
}

export async function fileExists(resource: Uri, suppressErrors: boolean = true): Promise<boolean> {
    if (suppressErrors) {
        try {
            return await fileExists(resource, false);
        } catch (e) {
            console.error({ e, resource });
            return false;
        }
    } else {
        return (await fs.statAsync(resource.fsPath)).isFile();
    }
}

export async function dirExists(resource: Uri, suppressErrors: boolean = true): Promise<boolean> {
    if (suppressErrors) {
        try {
            return await dirExists(resource, false);
        } catch (e) {
            console.error({ e, resource });
            return false;
        }
    } else {
        return (await fs.statAsync(resource.fsPath)).isDirectory();
    }
}

export async function exists(resource: Uri, suppressErrors: boolean = true): Promise<boolean> {
    if (suppressErrors) {
        try {
            return await exists(resource, false);
        } catch (e) {
            console.error({ e, resource });
            return false;
        }
    } else {
        return !!await fs.statAsync(resource.fsPath);
    }
}

export async function readFile(resource: Uri): Promise<string | null>;
export async function readFile(resource: Uri, suppressErrors: true): Promise<string | null>;
export async function readFile(resource: Uri, suppressErrors: false): Promise<string>;
export async function readFile(resource: Uri, suppressErrors: boolean = true): Promise<string | null> {
    if (suppressErrors) {
        try {
            return await readFile(resource, false);
        } catch (e) {
            console.error(e);
            return null;
        }
    } else {
        return (await fs.readFileAsync(resource.fsPath)).toString();
    }
}


export function isDescendent(resource: Uri, base: Uri): boolean {
    const resourceParts = path.normalize(isCaseInsensitive ? resource.fsPath.toLowerCase() : resource.fsPath).split(path.sep);
    const baseParts = path.normalize(isCaseInsensitive ? base.fsPath.toLowerCase() : base.fsPath).split(path.sep);

    if (baseParts.length > resourceParts.length) {
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
