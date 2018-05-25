import { Substitution } from '.';
import { commands } from 'vscode';
import { getWorkspaceFolderByName, isWorkspaceOpen, getWorkspaceFolderUri } from '../compat';
import { dropExt, relativePath, basename } from '../fsTools';

export const activeFileSubstitution: Substitution = {
    pattern: 'file(BaseName)?(NoExt)?',
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
};
export const relativeActiveFileSubstitution: Substitution = {
    pattern: /relativeFile(BaseName)?(NoExt)?/,
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
};

export const defaultSubstitutions: Substitution[] = [
    activeFileSubstitution,
    relativeActiveFileSubstitution,
    {
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