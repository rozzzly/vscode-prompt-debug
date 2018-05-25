import * as path from 'path';
import { workspace, commands, Uri } from 'vscode';
import { relativePath, homeDirUri, dropExt } from './fsTools';
import {
    isWorkspaceOpen,
    getActiveFileUri,
    getActiveFilePath,
    getWorkspaceFolder,
    isMultiRootSupported,
    getWorkspaceFolderByName,
    PotentiallyFauxWorkspaceFolder,
    getOpenFiles,
    getWorkspaceFolderUri
} from '../compat';

const userHome: RegExp = /^~/;
const subEscapeSplitter: RegExp = /(\$\{\s*\S+?[\S\s]*?\s*\})/g;
const subEscapeExtractor: RegExp = /\$\{\s*(\S+?[\S\s]*?)\s*\}/g;

export interface SubstitutionContext<D extends {} = {}> {
    data: D;
    activeFile: Uri | null;
    openFiles: Uri[];
    visibleFiles: Uri[];
    // workspaceFolder: PotentiallyFauxWorkspaceFolder | null;
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

export const containsSubstitution = (str: string): boolean => (
    str.includes('${') && subEscapeSplitter.test(str)
);

export type ExtractDataFromContext<C extends SubstitutionContext<any>> = (
    (C extends SubstitutionContext<infer D>
        ? D
        : never
    )
);

export type PartialContext<C extends SubstitutionContext> = {
    [K in Exclude<keyof C, 'data'>]?: C[K];
} & {
    data?: Partial<C['data']>
};
type derp = SubstitutionContext<{ foo: 'bar' }>;


export interface ContextChain<B extends SubstitutionContext> {
    // merge<D extends {} = {}, O extends SubstitutionContext<D> = SubstitutionContext<D>>(overrides: Partial<O>): SubstitutionContext<C & O>;
    merge<O extends SubstitutionContext>(overrides: PartialContext<O>): ContextChain<B & O>;
    extract(): B;
}


const createMergeContext = <O extends SubstitutionContext>(...overrides: (PartialContext<O>)[]): ContextChain<O>  => ({
    merge: (override) => createMergeContext(...override as any, override) as any,
    extract: () => overrides.reduce((reduction, override) => {
        const { data = {}, ...extra } = override as any;
        return {
            ...reduction as any,
            ...extra,
            data: {
                ...(reduction.data || {}) as any,
                ...data
            }
        };
    }, {})
});
const foo = createMergeContext({ });
const foo2 = foo.merge({ herpDerp:false });

export function createContext<D extends {} = {}>(): SubstitutionContext<D>;
export function createContext<D extends {} = {}, O extends Partial<SubstitutionContext<D>> = {}>(overrides: O): SubstitutionContext<D>;
export function createContext<D extends {} = {}, O extends Partial<SubstitutionContext<D>> = {}>(overrides: O = {} as any): SubstitutionContext<D> {
    let base = {
        openFiles: getOpenFiles(),
        activeFile: getActiveFileUri(),
        visibleFiles: getOpenFiles(true),
    };
    
    //     ...extra,
    //     data: ((data)
    //         ? data
    //         : {}
    //     )
    // };
}


/**
 * @see https://github.com/Microsoft/vscode/blob/master/src/vs/workbench/services/configurationResolver/node/variableResolver.ts
 */

export const substitute = (
    str: string,
    ctx: Partial<SubstitutionContext> = {},
    subs: Substitution[] = defaultSubstitutions
): Promise<string> => (
    Promise.all((str)
        .replace(userHome, homeDirUri.fsPath)
        .split(subEscapeSplitter)
        .map(piece => new Promise<string>((resolve, reject) => {
            const fullCTX = createContext(ctx);
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
                        resolve(handler.resolver(fullCTX));
                    } else {
                        const [_, ...parameters] = innerMatch!;
                        resolve(handler.resolver(fullCTX, ...parameters));
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