import * as path from 'path';
import { workspace, commands,  } from 'vscode';
import { getActiveFilePath, getActiveFileUri, relative, homeDir } from './fsTools';
import { isMultiRootSupported, isWorkspaceOpen, getWorkspaceFolder, getWorkspaceFolderByName } from './compat';

const userHome: RegExp = /^~/;

const subEscapeSplitter: RegExp = /(\$\{\s*\S+[\s\S]*?\})/g
const subEscapeExtractor: RegExp = /\$\{(\s*\S+[\s\S]*?)\}/g;

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
        pattern: /command\:([\s\S]+)/,
        async resolver(command): Promise<string> {
            const cmds = await commands.getCommands();
            if (cmds.includes(command)) {
                return commands.executeCommand<string>(command).then(out => out || '');
            } else {
                throw new TypeError('unregistered command.')
            }
        }
    },
    {
        pattern: /file/,
        resolver(): string {
            const activeFile = getActiveFilePath();
            if (activeFile) {
                return activeFile;
            } else {
                throw new TypeError('No open file.')
            }
        }
    },
    {
        pattern: /relativeFile/,
        async resolver(): Promise<string> {
            const activeFile = getActiveFileUri();
            if (activeFile) {
                if (isWorkspaceOpen()) {
                    const ws = await getWorkspaceFolder(activeFile);
                    if (ws) {
                        return relative(activeFile, ws.uri);
                    } else {
                        throw new TypeError('Could not find workspace for this resource!')
                    }
                } else {
                    throw new TypeError('No open workspaces.')
                }
            } else {
                throw new TypeError('No open file.')
            }
        }
    },
    {
        pattern: /(?:rootPath|workspaceFolder(?:\:([^\.]+)\:)?Basename)/,
        async resolver(workspaceName: string | undefined): Promise<string> {
            if (isWorkspaceOpen()) {
                const ws = getWorkspaceFolderByName(workspaceName)
                if (ws) {
                    return path.basename(ws.uri.fsPath);
                } else {
                    throw new TypeError('Could not find workspace for that resource!');
                }
             } else {
                throw new TypeError('No open workspaces.')
            }
        }
    },
    {
        pattern: /(?:rootPath|workspaceFolder(?:\:([^\.]+))?)/,
        async resolver(workspaceName: string | undefined): Promise<string> {
            if (isWorkspaceOpen()) {
                const ws = getWorkspaceFolderByName(workspaceName)
                if (ws) {
                    return ws.uri.fsPath;
                } else {
                    throw new TypeError('Could not find workspace for that resource!');
                }
             } else {
                throw new TypeError('No open workspaces.')
            }
        }
    }
];

export const containsSubstitution = (str: string): boolean => (
    str.includes('${') && subEscapeSplitter.test(str)
);

export const substitute = (str: string, handlers: SubPatternHandler[] = defaultHandlers): Promise<string> => (
    Promise.all((str)
        .replace(userHome, homeDir)
        .split(subEscapeSplitter)
        .map(piece => new Promise<string>((resolve, reject) => {
            const outerMatch = subEscapeExtractor.exec(piece);
            if (outerMatch) {
                const subExpression = outerMatch[1];
                let innerMatch: RegExpExecArray | null = null;
                const handler = handlers.find(handler => {
                    if (isSimple(handler)) {
                        return subExpression === handler.pattern;
                    } else {
                        innerMatch = handler.pattern.exec(subExpression);
                        return !!innerMatch && innerMatch[0] === subExpression; // make sure match is a complete match
                    }
                });
                if (handler) {
                    if (isSimple(handler)) {
                        resolve(handler.resolver())
                    } else {
                        const [_, ...parameters] = innerMatch!;
                        resolve(handler.resolver(...parameters));
                    }
                } else {
                    reject({
                        msg: 'unknown substitution pattern encountered',
                        str, piece, handlers
                    });
                }
            } else {
                resolve(piece);
            }
        }))
    ).then(pieces => path.join(...pieces))
);