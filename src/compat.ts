import * as path from 'path';
import * as semver from 'semver';
import * as vscode from 'vscode';
import { LooseUri, isDescendent, toUri } from './fsTools';

export const isMultiRootSupported: boolean = semver.gte(semver.coerce(vscode.version), semver.coerce('v1.18'));


export const isWorkspaceOpen = (): boolean => (
    (isMultiRootSupported && vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0)
    ||
    (vscode.workspace.rootPath && vscode.workspace.rootPath.length > 0)
);

export type PotentiallyFauxWorkspace = vscode.WorkspaceFolder & { faux?: true };

export function getWorkspaces(): PotentiallyFauxWorkspace[] | null {
    if (isWorkspaceOpen()) {
        if (isMultiRootSupported) {
            return vscode.workspace.workspaceFolders as PotentiallyFauxWorkspace[];
        } else {
            return [{
                index: 0,
                faux: true,
                name: path.basename(vscode.workspace.rootPath),
                uri: vscode.Uri.file(vscode.workspace.rootPath)
            }];
        }
    } else {
        return null;
    }
}

export function getWorkspace(): PotentiallyFauxWorkspace | null;
export function getWorkspace(resource: vscode.Uri): PotentiallyFauxWorkspace | null;
export async function getWorkspace(resource: LooseUri): Promise<PotentiallyFauxWorkspace | null>;
export function getWorkspace(resource?: LooseUri): Promise<PotentiallyFauxWorkspace | null> | PotentiallyFauxWorkspace | null {
    if (isWorkspaceOpen()) {
       if (resource) {
            if (isMultiRootSupported) {
                if (typeof resource === 'string') {
                    return (async () => {
                        const res = await toUri(resource);
                        const ws = vscode.workspace.getWorkspaceFolder(res);
                        return (ws) ? ws : null;
                    })();
                } else {
                    const ws = vscode.workspace.getWorkspaceFolder(resource);
                    return (ws) ? ws : null;
                }
            } else {
                return ((isDescendent(resource, vscode.workspace.rootPath))
                    .then(isChild => ((isChild)
                        ? ({
                            index: 0,
                            faux: true as true,
                            name: path.basename(vscode.workspace.rootPath),
                            uri: vscode.Uri.file(vscode.workspace.rootPath)
                        }) : (
                            null
                        )
                    ))
                );
            }
        } else {
            if (isMultiRootSupported) {
                return vscode.workspace.workspaceFolders[0];
            } else {
                return {
                    index: 0,
                    faux: true,
                    name: path.basename(vscode.workspace.rootPath),
                    uri: vscode.Uri.file(vscode.workspace.rootPath)
                };
            }
        }
    } else {
        return (resource) ? Promise.resolve(null) : null;
    }
}

export function getWorkspaceFolderUri(): vscode.Uri | null;
export async function getWorkspaceFolderUri(resource: LooseUri): Promise<vscode.Uri | null>;
export function getWorkspaceFolderUri(resource?: LooseUri): vscode.Uri | null | Promise<vscode.Uri | null> {
    if (resource) {
        return getWorkspace(resource).then(ws => ws && ws.uri || null);
    } else {
            const ws = getWorkspaces();
            return ws && ws
    }
}

export function getWorkspaceFolderPath(): string | null;
export async function getWorkspaceFolderPath(resource: LooseUri): Promise<string | null>;
export function getWorkspaceFolderPath(resource?: LooseUri): string | null | Promise<string | null> {
    if (resource) {
        return getWorkspaceFolderUri(resource).then(uri => uri.fsPath);
    } else {
        return getWorkspaceFolderUri().fsPath;
    }
}