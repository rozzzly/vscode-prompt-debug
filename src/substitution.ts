import * as path from 'path';
import { workspace, commands, Uri,  } from 'vscode';
import { getActiveFilePath, getActiveFileUri, relativePath, homeDirUri } from './fsTools';
import { isMultiRootSupported, isWorkspaceOpen, getWorkspaceFolder, getWorkspaceFolderByName, PotentiallyFauxWorkspaceFolder } from './compat';

const userHome: RegExp = /^~/;
const subEscapeSplitter: RegExp = /(\$\{\s*\S+[\S\s]*?\s*\})/g;
const subEscapeExtractor: RegExp = /\$\{\s*(\S+[\S\s]*?)\s*\}/g;


export interface SubstitutionContext<D extends {} = {}> {
    data: D;
    activeFile: Uri | null;
    workspaceFolder: PotentiallyFauxWorkspaceFolder | null;
}

export interface Substitution<D extends {} = {}> {
    pattern: string | RegExp;
    resolver(ctx: SubstitutionContext<D>, ...value: string[]): string | Promise<string>;
}

export interface SimpleSubstitution<D extends {} = {}> extends Substitution<D> {
    pattern: string;
    resolver(ctx: SubstitutionContext<D>): string | Promise<string>;
}

export interface ParameterizedSubstitution<D extends {} = D> extends Substitution<D> {
    pattern: RegExp;
    resolver(ctx: SubstitutionContext<D>, ...value: string[]): string | Promise<string>;
}


export const isSimple = (value: any): value is SimpleSubstitution => typeof value.pattern === 'string';
export const isParameterized = (value: any): value is ParameterizedSubstitution => value.pattern instanceof RegExp;

export const defaultSubstitutions: Substitution[] = [
    {
        pattern: /command\:([\s\S]+)/,
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
        pattern: 'file',
        resolver(ctx): string {
            if (ctx.activeFile) {
                return ctx.activeFile.fsPath;
            } else {
                throw new TypeError('No open file.');
            }
        }
    },
    {
        pattern: /relativeFile/,
        async resolver(ctx): Promise<string> {
            if (ctx.activeFile) {
                if (ctx.workspaceFolder) {
                    return relativePath(ctx.activeFile, ctx.workspaceFolder.uri);
                } else if (isWorkspaceOpen()) {
                    throw new TypeError('No open workspaces containing that resource.');
                } else {
                    throw new TypeError('No open workspaces.');
                }
            } else {
                throw new TypeError('No open file.');
            }
        }
    },
    {
        pattern: /rootPath|workspaceFolder(?:\:([^\.]+)\:)?Basename/,
        async resolver(ctx, workspaceName: string | undefined): Promise<string> {
            if (isWorkspaceOpen()) {
                const ws = ((workspaceName)
                    ? getWorkspaceFolderByName(workspaceName)
                    : ctx.workspaceFolder
                );
                if (ws) {
                    return path.basename(ws.uri.fsPath);
                } else {
                    throw new TypeError('Could not find workspace for that resource!');
                }
             } else {
                throw new TypeError('No open workspaces.');
            }
        }
    },
    {
        pattern: /rootPath|workspaceFolder(?:\:([^\.]+))?/,
        async resolver(ctx, workspaceName: string | undefined): Promise<string> {
            if (isWorkspaceOpen()) {
                const ws = ((workspaceName)
                    ? getWorkspaceFolderByName(workspaceName)
                    : ctx.workspaceFolder
                );
                if (ws) {
                    return ws.uri.fsPath;
                } else {
                    throw new TypeError('Could not find workspace for that resource!');
                }
            } else {
                throw new TypeError('No open workspaces.');
            }
        }
    }
];

export const containsSubstitution = (str: string): boolean => (
    str.includes('${') && subEscapeSplitter.test(str)
);



export function createContext<D extends {} = {}>(data: D = {} as D): SubstitutionContext<D> {
    const ctx = { data } as SubstitutionContext<D>;
    ctx.activeFile = getActiveFileUri();
    ctx.workspaceFolder = getWorkspaceFolder(ctx.activeFile);
    return ctx;
}

export const substitute = (
    str: string,
    subs: Substitution[] = defaultSubstitutions,
    ctx: SubstitutionContext = createContext()
): Promise<string> => (
    Promise.all((str)
        .replace(userHome, homeDirUri.fsPath)
        .split(subEscapeSplitter)
        .map(piece => new Promise<string>((resolve, reject) => {
            const outerMatch = subEscapeExtractor.exec(piece);
            if (outerMatch) {
                const subExpression = outerMatch[1].trim();
                let innerMatch: RegExpExecArray | null = null;
                const handler = subs.find(sub => {
                    if (isParameterized(sub)) {
                        innerMatch = sub.pattern.exec(subExpression);
                        return !!innerMatch && innerMatch[0] === subExpression; // make sure match is a complete (end to end) match
                    } else {
                        return subExpression === sub.pattern;
                    }
                });
                if (handler) {
                    if (isSimple(handler)) {
                        resolve(handler.resolver(ctx));
                    } else {
                        const [_, ...parameters] = innerMatch!;
                        resolve(handler.resolver(ctx, ...parameters));
                    }
                } else {
                    reject({
                        msg: 'unknown substitution pattern encountered',
                        str, piece, subs
                    });
                }
            } else {
                resolve(piece);
            }
        }))
    ).then(pieces => path.join(...pieces))
);