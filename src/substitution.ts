import * as path from 'path';
import { workspace, commands, Uri,  } from 'vscode';
import { getActiveFilePath, getActiveFileUri, relativePath, homeDirUri } from './fsTools';
import { isMultiRootSupported, isWorkspaceOpen, getWorkspaceFolder, getWorkspaceFolderByName, PotentiallyFauxWorkspaceFolder } from './compat';

const userHome: RegExp = /^~/;

const subEscapeSplitter: RegExp = /(\$\{\s*\S+[\s\S]*?\})/g
const subEscapeExtractor: RegExp = /\$\{(\s*\S+[\s\S]*?)\}/g;


export type SubstitutionContext<C extends {} = {}> = (
    & {
        activeFile: Uri | null;
        workspaceFolder: PotentiallyFauxWorkspaceFolder | null;
    }
    & {
        [K in keyof C]: C[K];
    }
);

export type SimpleSubPatternHandler<C extends {} = {}> = {
    pattern: string;
    resolver(ctx: SubstitutionContext<C>): string | Promise<string>;
};

export type ParameterizedSubPatternHandler<C extends {} = {}> = {
    pattern: RegExp;
    resolver(ctx: SubstitutionContext<C>, ...value: string[]): string | Promise<string>;
};

export type Substitution = (
    | SimpleSubPatternHandler
    | ParameterizedSubPatternHandler
);

export const isSimple = (value: any): value is SimpleSubPatternHandler => typeof value.pattern === 'string';
export const isParameterized = (value: any): value is ParameterizedSubPatternHandler => !isSimple(value);

export const defaultSubstitutions: Substitution[] = [
    {
        pattern: /command\:([\s\S]+)/,
        async resolver(ctx, command: string): Promise<string> {
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
        resolver(ctx): string {
            if (ctx.activeFile) {
                return ctx.activeFile.;
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
                        return relativePath(activeFile, ws.uri);
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
        async resolver(ctx, workspaceName: string | undefined): Promise<string> {
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
        async resolver(ctx, workspaceName: string | undefined): Promise<string> {
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



export function createContext<C extends {} = {}>(custom?: C): SubstitutionContext & C {
    const ctx = { ...(custom || {}) } as SubstitutionContext & C;
    ctx.activeFile = getActiveFileUri();
    ctx.workspaceFolder =  (ctx.activeFile) ? getWorkspaceFolder(ctx.activeFile) : null;
    return ctx;
}

export const substitute = <C extends {} = {}>(str: string, ctx: SubstitutionContext & C = createContext<C>(), subs: Substitution[] = defaultSubstitutions): Promise<string> => (
    Promise.all((str)
        .replace(userHome, homeDirUri.fsPath)
        .split(subEscapeSplitter)
        .map(piece => new Promise<string>((resolve, reject) => {
            const outerMatch = subEscapeExtractor.exec(piece);
            if (outerMatch) {
                const subExpression = outerMatch[1];
                let innerMatch: RegExpExecArray | null = null;
                const handler = subs.find(sub => {
                    if (isSimple(sub)) {
                        return subExpression === sub.pattern;
                    } else {
                        innerMatch = sub.pattern.exec(subExpression);
                        return !!innerMatch && innerMatch[0] === subExpression; // make sure match is a complete match
                    }
                });
                if (handler) {
                    if (isSimple(handler)) {
                        resolve(handler.resolver(ctx))
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