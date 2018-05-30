import { commands } from 'vscode';

import { Substitution } from './api';
import { dropExt, relativePath, basename, getExt, dirname } from '../fsTools';
import { getWorkspaceFolderByName, isWorkspaceOpen, getWorkspaceFolderUri } from '../compat';

export const defaultSubstitutions: Substitution[] = [
    {
        identifier: 'activeFile',
        pattern: /(?:activeF|f)ile(BaseName)?(NoExt)?/,
        resolver(ctx, baseName: string | undefined, noExt: string | undefined): string {
            if (ctx.activeFile) {
                if (baseName) {
                    if (noExt) {
                        return basename(ctx.activeFile.fsPath);
                    } else {
                        return basename(dropExt(ctx.activeFile.fsPath));
                    }
                } else {
                    if (noExt) {
                        return dropExt(ctx.activeFile.fsPath);
                    } else {
                        return ctx.activeFile.fsPath;
                    }
                }
            } else {
                throw new TypeError('No open file.');
            }
        }
    },
    {
        identifier: 'relativeActiveFile',
        pattern: /relative(?:Active)?File(BaseName)?(NoExt)?/,
        async resolver(ctx, baseName: string | undefined, noExt: string | undefined): Promise<string> {
            if (ctx.activeFile) {
                const wsUri = getWorkspaceFolderUri(ctx.activeFile);
                if (wsUri) {
                    const relative = relativePath(ctx.activeFile, wsUri);
                    if (baseName) {
                        if (noExt) {
                            return basename(relative);
                        } else {
                            return basename(dropExt(relative));
                        }
                    } else {
                        if (noExt) {
                            return dropExt(relative);
                        } else {
                            return relative;
                        }
                    }
                } else {
                    throw new TypeError('No open workspaces containing that resource.');
                }
            } else {
                throw new TypeError('No open file.');
            }
        }
    },
    {
        identifier: 'activeFileDirName',
        pattern: /(?:activeF|f)ileDirName/,
        resolver(ctx): string {
            if (ctx.activeFile) {
                return dirname(ctx.activeFile);
            } else {
                throw new TypeError('No open file.');
            }
        }
    },
    {
        identifier: 'relativeActiveFileDirName',
        pattern: /relative(?:Active)FileDirName/,
        resolver(ctx): string {
            if (ctx.activeFile) {
                const wsUri = getWorkspaceFolderUri(ctx.activeFile);
                if (wsUri) {
                    const relative = relativePath(ctx.activeFile, wsUri);
                    return dirname(relative);
                } else {
                    throw new TypeError('No open workspaces containing that resource.');
                }
            } else {
                throw new TypeError('No open file.');
            }
        }
    },
    {
        identifier: 'activeFileExt',
        pattern: /(?:activeF|f)ileExt/,
        resolver(ctx): string {
            if (ctx.activeFile) {
                return getExt(ctx.activeFile);
            } else {
                throw new TypeError('No open file.');
            }
        }
    },
    {
        identifier: 'command',
        pattern: /command\:(\S+[\s\S]*)/,
        async resolver(ctx, command): Promise<string> {
            const cmds = await commands.getCommands();
            if (cmds.includes(command)) {
                return commands.executeCommand<string>(command).then(out => out || '');
            } else {
                throw new TypeError('unregistered command.');
            }
        }
    },
    {
        identifier: 'workspace',
        pattern: /rootPath|workspace(?:Folder|Root)(?:\:([^\.]+)\:)?(BaseName)?/,
        async resolver(ctx, workspaceName: string | undefined, baseName: string | undefined): Promise<string> {
            if (isWorkspaceOpen()) {
                const ws = getWorkspaceFolderByName(workspaceName);
                if (ws) {
                    return ((baseName)
                        ? basename(ws.uri)
                        : ws.uri.fsPath
                    );
                } else {
                    throw new TypeError('Could not find workspace for that resource!');
                }
            } else {
                throw new TypeError('No open workspaces.');
            }
        }
    }
];