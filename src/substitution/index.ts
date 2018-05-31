import * as path from 'path';
import { workspace, commands, Uri } from 'vscode';
import { relativePath, homeDirUri, dropExt } from '../fsTools';
import {
    isWorkspaceOpen,
    getActiveFileUri,
    getActiveFilePath,
    getWorkspaceFolder,
    isMultiRootSupported,
    getWorkspaceFolderByName,
    PotentiallyFauxWorkspaceFolder,
    getOpenFiles,
    getWorkspaceFolderUri,
    isWindows
} from '../compat';

import { SubstitutionContext, Substitution, createContext, isParameterized, isSimple } from './api';
import { defaultSubstitutions } from './definitions';

const userHome: RegExp = /^~/;
const foreignPathSeparator: RegExp = (isWindows) ? /\//g : /\\/g;
const subEscapeSplitter: RegExp = /(\$\{\s*\S+?[\S\s]*?\s*\})/g;
const subEscapeExtractor: RegExp = /\$\{\s*(\S+?[\S\s]*?)\s*\}/g;

export const containsSubstitution = (str: string): boolean => (
    str.includes('${') && subEscapeSplitter.test(str)
);

/**
 * @see https://github.com/Microsoft/vscode/blob/master/src/vs/workbench/services/configurationResolver/node/variableResolver.ts
 */

export const substitute = <C extends {} = {}>(
    str: string,
    ctx: Partial<SubstitutionContext<C>> = {},
    subs: Substitution<C>[] = defaultSubstitutions
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
    ).then(pieces => pieces.join(''))
);