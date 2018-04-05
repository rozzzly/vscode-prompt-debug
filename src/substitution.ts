import * as path from 'path';
import * as vscode from 'vscode';
import { workspace } from 'vscode';
import { getActiveFile, areWorkspacesSupported, areWorkspacesDefined, getActiveFileUri } from './fsTools';

const subEscape: RegExp = /(\$\{\s*\S+?(?:\s?\S?)*?\})/g
const unwrapSubEscape: RegExp = /\$\{([\s|\S]*)\}/g;

export type SimpleSubPatternHandler = {
    pattern: string;
    resolver(): string | Promise<string>;
}

export type ParameterizedSubPatternHandler = {
    pattern: RegExp;
    resolver(...value: string[]): string | Promise<string>;
}

export type SubPatternHandler = (
    | SimpleSubPatternHandler
    | ParameterizedSubPatternHandler
);

export const isSimple = (value: any): value is SimpleSubPatternHandler => typeof value.pattern === 'string';
export const isParameterized = (value: any): value is ParameterizedSubPatternHandler => !isSimple(value);

const defaultHandlers: SubPatternHandler[] = [
    {
        pattern: /command\:((?:\s\S)+)/,
        async resolver(command): Promise<string> {
            const commands = await vscode.commands.getCommands();
            if (commands.includes(command)) {
                return vscode.commands.executeCommand<string>(command);
            } else {
                throw new TypeError('unregistered command.')
            }
        }
    },
    {
        pattern: /file/,
        resolver(): string {
            const activeFile = getActiveFile();
            if (activeFile) {
                return activeFile;
            } else {
                throw new TypeError('No open file.')
            }
        }
    },
    {
        pattern: /relativeFile/,
        resolver(): string {
            const activeFile = getActiveFileUri();
            if (activeFile) {
                if (areWorkspacesSupported() && areWorkspacesDefined()) {
                    const workspace = vscode.workspace.getWorkspaceFolder(activeFile);
                    return '';
                } else {
                    throw new TypeError('No workspaces defined.')
                }
            } else {
                throw new TypeError('No open file.')
            }
        }
    },
    {
        pattern: /(?:workspaceRoot|workspaceFolder(?:\:([^\.]+)\:)?Basename)/,
        resolver(workspaceName: string | undefined): string {
            if (areWorkspacesSupported() && areWorkspacesDefined()) {
                if (workspaceName) {
                    const workspace  = vscode.workspace.workspaceFolders.find(workspace => workspace.name === workspaceName);
                    if (workspace) {
                        return path.basename(workspace.uri.fsPath);
                    } else {
                        throw TypeError('No workspace with that name.')
                    }
                } else {
                    return path.basename(vscode.workspace.workspaceFolders[0].uri.fsPath);
                }
            } else if (!areWorkspacesSupported() && !workspaceName) {
                return path.basename(vscode.workspace.rootPath)
            } else {
                throw new TypeError('No open workspaces.')
            }
        }
    },
    {
        pattern: /(?:workspaceRoot|workspaceFolder(?:\:([^\.]+))?)/,
        resolver(workspaceName: string | undefined): string {
            if (areWorkspacesSupported() && areWorkspacesDefined()) {
                if (workspaceName) {
                    const workspace  = vscode.workspace.workspaceFolders.find(workspace => workspace.name === workspaceName);
                    if (workspace) {
                        return workspace.uri.fsPath;
                    } else {
                        throw TypeError('No workspace with that name.')
                    }
                } else {
                    return vscode.workspace.workspaceFolders[0].uri.fsPath;
                }
            } else if (!areWorkspacesSupported() && !workspaceName) {
                return vscode.workspace.rootPath;
            } else {
                throw new TypeError('No open workspaces.')
            }
        }
    }
];

export const containsSubstitutions = (str: string): boolean => (
    subEscape.test(str)
);

export const substitute = (str: string, handlers: SubPatternHandler[] = defaultHandlers): Promise<string> => (
    Promise.all((str)
        .split(subEscape)
        .map(piece => new Promise<string>((resolve, reject) => {
            const subExpression = unwrapSubEscape.exec(piece)[1];
            let match: RegExpExecArray = undefined;
            const handler = handlers.find(handler => {
                if (isSimple(handler)) {
                    return subExpression === handler.pattern;
                } else {
                    match = handler.pattern.exec(subExpression);
                    return !!match && match[0] === subExpression; // make sure match is a complete match
                }
            });
            if (handler) {
                if (isSimple(handler)) {
                    resolve(handler.resolver())
                } else {
                    const [_, ...parameters] = match;
                    resolve(handler.resolver(...parameters));
                }
            } else {
                console.warn('unknown substitution pattern encountered', { str, piece, handler });
                resolve(piece); // for now, just return the unchanged part
            }
        }))
    ).then(pieces => pieces.join())
);