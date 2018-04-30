import * as path from 'path';
import * as semver from 'semver';
import * as JSON6 from 'json-6';

import { Uri, workspace, WorkspaceFolder, version, WorkspaceConfiguration, ExtensionContext } from 'vscode';
import { LooseUri, isDescendent, toUri, dirExists, fileExists, readFile } from './fsTools';
import { PREFIX, CONFIG_ID_FRAGMENTS } from './constants';
import { isEqual } from 'lodash';
import { isArray } from 'util';

export const isCaseInsensitive = process.platform === 'win32';
export const isMultiRootSupported: boolean = semver.gte(semver.coerce(version)!, semver.coerce('v1.18')!);

export const isWorkspaceOpen = (): boolean => (
    !!(isMultiRootSupported && workspace.workspaceFolders && workspace.workspaceFolders.length > 0)
        ||
    !!(workspace.rootPath && workspace.rootPath.length > 0)
);

export type PotentiallyFauxWorkspaceFolder = WorkspaceFolder & { faux?: true };

export function getWorkspaceFolders(): PotentiallyFauxWorkspaceFolder[] | null {
    if (isWorkspaceOpen()) {
        if (isMultiRootSupported) {
            return workspace.workspaceFolders as PotentiallyFauxWorkspaceFolder[];
        } else {
            return [{
                index: 0,
                faux: true,
                name: path.basename(workspace.rootPath!),
                uri: Uri.file(workspace.rootPath!)
            }];
        }
    } else {
        return null;
    }
}

export function getWorkspaceFolderByName(workspaceName?: string): PotentiallyFauxWorkspaceFolder | null {
    const ws = getWorkspaceFolders();
    if (ws) {
        if (workspaceName) {
            if (isMultiRootSupported) {
                return ws.find(w => w.name === workspaceName) || null;
            } else {
                throw new ReferenceError('Workspace name given when workspaces are not supported!');
            }
        } else {
            return (ws.length === 1) ? ws[0] : null;
        }
    } else {
        return null;
    }
}


export function getWorkspaceFolder(resource?: Uri | null): PotentiallyFauxWorkspaceFolder | null {
    if (isWorkspaceOpen()) {
       if (resource) {
            if (isMultiRootSupported) {
                const ws = workspace.getWorkspaceFolder(resource);
                return (ws) ? ws : null;
            } else {
                if (isDescendent(resource, Uri.file(workspace.rootPath!))) {
                    return {
                        index: 0,
                        faux: true as true,
                        name: path.basename(workspace.rootPath!),
                        uri: Uri.file(workspace.rootPath!)
                    };
                } else {
                    return null;
                }
            }
        } else {
            if (isMultiRootSupported) {
                return workspace.workspaceFolders![0];
            } else {
                return {
                    index: 0,
                    faux: true,
                    name: path.basename(workspace.rootPath!),
                    uri: Uri.file(workspace.rootPath!)
                };
            }
        }
    } else {
        return null;
    }
}

export function getWorkspaceFolderUri(resource?: Uri): Uri | null {
    const ws = getWorkspaceFolder(resource);
    return (ws) ? ws.uri : null;
}

export function getWorkspaceFolderPath(resource?: Uri): string | null {
    const ws = getWorkspaceFolder(resource);
    return (ws) ? ws.uri.fsPath : null;
}

export type ConfigScope = (
    | 'user'
    | 'workspace'
    | 'workspaceFolders'
);

export function getConfig(resource?: Uri): WorkspaceConfiguration {
    if (resource && isMultiRootSupported) {
        return workspace.getConfiguration(PREFIX, resource);
    } else {
        return workspace.getConfiguration(PREFIX);
    }
}

export let userConfigUri: Uri | null = null;

export async function findUserConfig(context: ExtensionContext): Promise<Uri | null> {
    if (userConfigUri) {
        return userConfigUri;
    } else {
        if (context.storagePath) {
            const userDir = path.join(...context.storagePath.split(path.sep).slice(0, -3));
            console.log('userDir', userDir);
            if (!await dirExists(Uri.file(userDir))) {
                console.error('process.cwd does not contain "User" dir', userDir);
                return null;
            } else {
                const userConfigPath = path.join(userDir, 'settings.json');
                console.log(userConfigPath);
                if (!await fileExists(Uri.file(userConfigPath))) {
                    console.error('Could not find user config in expected location', userConfigPath);
                    return null;
                } else {
                    userConfigUri = Uri.file(userConfigPath);
                    return userConfigUri;
                }
            }
        } else {
            console.error('context.storagePath is undefined!');
            return null;
        }
    }
}
export const configKeyNotFound: unique symbol = Symbol('configKeyNotFound'); /// TODO ::: namespace this
export type configKeyNotFound = typeof configKeyNotFound; /// TODO ::: namespace this

export function objLookup<T>(config: object, key: string): T | configKeyNotFound;
export function objLookup<T, D>(config: object, key: string, defaultValue: T): T | D;
export function objLookup<T>(config: object, key: string, defaultValue: T | configKeyNotFound = configKeyNotFound): T | configKeyNotFound {
    let node: any = config;
    let allParts = key.split('.');
    let parts: string[] = [...allParts];
    let unusedParts: string[] = [];
    let selectedKeys: string[] = [];
    let found: boolean = false;
    while (true) {
        const keys = Object.keys(node);
        const joined = parts.join('.');
        if (keys.includes(joined)) {
            selectedKeys.push(joined);
            if (unusedParts.length) {
                node = node[joined];
                parts = [...unusedParts];
                unusedParts = [];
            } else {
                return node[joined];
            }
        } else if (parts.length > 1) {
            const left = parts.slice(0, -1);
            const right = parts.slice(-1);
            unusedParts = [...right, ...unusedParts];
            parts = [...left]; // will have 1 or more items
        } else {
            if (defaultValue !== configKeyNotFound) return defaultValue;
            else return configKeyNotFound;
        }
    }
}

export async function getUserConfig(): Promise<object | null>;
export async function getUserConfig(suppressErrors: false): Promise<object>;
export async function getUserConfig(suppressErrors: true): Promise<object | null>;
export async function getUserConfig(suppressErrors: boolean = true): Promise<object | null> {
    if (userConfigUri) {
        if (suppressErrors) {
            try {
                const config = await getUserConfig(false);
                return config;
            } catch (e) {
                console.error(e);
                return null;
            }
        } else {
            const content = await readFile(userConfigUri);
            return JSON6.parse(content);
        }
    } else {
        if (suppressErrors) {
            console.error('user config has not been located');
            return null;
        } else {
            throw new Error('user config has not been located');
        }
    }
}