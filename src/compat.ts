import * as path from 'path';
import * as semver from 'semver';
import { Uri, workspace, WorkspaceFolder, version, WorkspaceConfiguration, ExtensionContext } from 'vscode';
import { LooseUri, isDescendent, toUri, dirExists, fileExists } from './fsTools';
import { PREFIX, CONFIG_ID_FRAGMENTS } from './constants';

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

export function config(resource?: Uri): WorkspaceConfiguration {
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