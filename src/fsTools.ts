import * as path from 'path';
import * as crypto from 'crypto';
import * as fs from 'fs-extra-promise';

import { homedir } from 'os';
import { Uri } from 'vscode';

import { isWindows } from './compat';
import { substitute, containsSubstitution } from './substitution';
import { wrapDefault, makeSafe } from './misc';

export const homeDirPath: string = homedir();
export const homeDirUri: Uri = Uri.file(homeDirPath);

export type LooseUri = string | Uri;

export const getExt = (resource: LooseUri): string => path.extname(asPath(resource));

export function dropExt(resource: LooseUri, ext?: string): string;
export function dropExt(_resource: LooseUri, _ext?: string): string {
    const resource = asPath(_resource);
    const ext = ((_ext === undefined)
        ? getExt(resource)
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

export const dirname = (resource: LooseUri): string => (
    path.dirname(asPath(resource))
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

export const fileHash = makeSafe(async (resource: Uri): Promise<string> => (
    new Promise<string>((resolve, reject) => {
        try {
            const stream = fs.createReadStream(resource.fsPath);
            stream.on('error', e => {
                reject(e);
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
            reject(e);
        }
    })
), null);


export const fileExists: (resource: Uri) => Promise<boolean> = (
    wrapDefault(async (resource: Uri): Promise<boolean> => (
        (await fs.statAsync(resource.fsPath)).isFile()
    ), false)
);

export const dirExists: (resource: Uri) => Promise<boolean> = (
    wrapDefault(async (resource: Uri): Promise<boolean> => (
        (await fs.statAsync(resource.fsPath)).isDirectory()
    ), false)
);


export const exists: (resource: Uri) => Promise<boolean> = (
    wrapDefault(async (resource: Uri): Promise<boolean> => (
        !!(await fs.statAsync(resource.fsPath))
    ), false)
);

export const readFile = makeSafe(async (resource: Uri): Promise<string> => (
    fs.readFileAsync(resource.fsPath, {})
), null);


export function isDescendent(resource: Uri, base: Uri): boolean {
    const resourceParts = path.normalize(isWindows ? resource.fsPath.toLowerCase() : resource.fsPath).split(path.sep);
    const baseParts = path.normalize(isWindows ? base.fsPath.toLowerCase() : base.fsPath).split(path.sep);

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
