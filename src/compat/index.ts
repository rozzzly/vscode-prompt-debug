import * as path from 'path';
import * as semver from 'semver';

import {
    Uri,
    window,
    version,
    workspace,
    Selection,
    TextEditor,
    WorkspaceFolder
} from 'vscode';

import { isDescendent, dirExists, fileExists, readFile, LooseUri, asPath } from '../fsTools';
import { showWarning } from './message';

export const isWindows = process.platform === 'win32';
export const isMultiRootSupported: boolean = semver.gte(semver.coerce(version)!, semver.coerce('v1.18')!);


const UNIX_PATH_SEP: string = '/';
const UNIX_PATH_SEP_REGEXP: RegExp = /\//g;

const WINDOWS_PATH_SEP: string = '\\';
const WINDOWS_PATH_SEP_REGEXP: RegExp = /\\/g;

export const convertPathSeparators = (resource: LooseUri, forceUnix: boolean = false): string => (
    ((isWindows && !forceUnix)
        ? asPath(resource).replace(UNIX_PATH_SEP_REGEXP, WINDOWS_PATH_SEP)
        : asPath(resource).replace(WINDOWS_PATH_SEP_REGEXP, UNIX_PATH_SEP)
    )
);

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
                showWarning('Workspace name given when workspaces are not supported!');
                return null;
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

export function getOpenFiles(onlyVisible: boolean = false): Uri[] {
    if (onlyVisible) {
        return window.visibleTextEditors.map(editor => editor.document.uri);
    } else {
        return workspace.textDocuments.map(doc => doc.uri);
    }
}

export function getSelections(activeEditorOnly: boolean = false): Selection[] {
    if (activeEditorOnly) {
        const activeEditor = getActiveEditor();
        if (activeEditor) {
            return activeEditor.selections;
        } else {
            return [];
        }
    } else {
        return window.visibleTextEditors.reduce((reduction, editor) => [
            ...reduction,
            ...editor.selections
        ], []);
    }
}


export const getActiveFilePath = (): string | null => (
    ((window.activeTextEditor)
        ? window.activeTextEditor.document.uri.fsPath
        : null
    )
);

export const getActiveFileUri = (): Uri | null => (
    ((window.activeTextEditor)
        ? window.activeTextEditor.document.uri
        : null
    )
);

export const getActiveEditor = (): TextEditor | null => (
    ((window.activeTextEditor)
        ? window.activeTextEditor
        : null
    )
);