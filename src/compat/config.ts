import * as JSON6 from 'json-6';
import * as path from 'path';

import { isPlainObject } from 'lodash';
import {
    Uri,
    workspace,
    ExtensionContext,
    WorkspaceConfiguration
} from 'vscode';

import { readFile, dirExists, fileExists } from '../fsTools';
import { PREFIX, NO_ARG, NO_RESULT } from '../constants';
import { isMultiRootSupported } from '../compat';
import { DisplayableError, DisplayableErrorOpts, DisplayableErrorOptions } from './message';

export function getConfig(resource?: Uri): WorkspaceConfiguration {
    if (resource && isMultiRootSupported) {
        return workspace.getConfiguration(PREFIX, resource);
    } else {
        return workspace.getConfiguration(PREFIX);
    }
}

export let userConfigUri: Uri | null = null;


export class DerivationError extends DisplayableError< {
    protected [DisplayableErrorOpts]: {

    }
    
    protected getMessage(): string {
        throw new Error('Method not implemented.');
    }


}


export async function findUserConfig(context: ExtensionContext): Promise<Uri> {
    if (userConfigUri) {
        return userConfigUri;
    } else {
        if (context.storagePath) {
            /**
             * Use extension install path to derive root dir used by VSCode to store extension data/configs in the "user"/global scope.
             *
             * ### Example
             *
             * > extension: **context.storagePath**
             * > `~/.vscode-insiders/extensions/rozzzly-dev.vscode-prompt-debug-0.0.2`
             *
             * > rootDir: **context.storagePath/../..**
             * > `~/.vscode-insiders`
             *
             * > settingsFile: **context.storagePath/../../settings.json**
             * > `~/.vscode-insiders/settings.json`
             **/
            const userDir = path.join(...context.storagePath.split(path.sep).slice(0, -3));
            if (!await dirExists(Uri.file(userDir))) {
                console.error(`Cannot load dir of user config file: ${userDir}`);
            } else {
                const userConfigPath = path.join(userDir, 'settings.json');
                if (!await fileExists(Uri.file(userConfigPath))) {
                    console.error(`Cannot load user config file: ${userDir}`);
                    return null;
                } else {
                    // memoize and return
                    userConfigUri = Uri.file(userConfigPath);
                    return userConfigUri;
                }
            }
        } else {
            console.error('Cannot locate VSCode configuration root.');
            return null;
        }
    }
}

export interface ConfigLookupErrorMeta {
    key: string;
    cfg: {
        uri: Uri;
        content: string
        parsed: object;
    };
}

export class ConfigLookupError extends DisplayableError<ConfigLookupErrorMeta> {
    protected [DisplayableErrorOpts]: DisplayableErrorOptions = {
        kind: 'warning',
        modal: false
    };
    protected getMessage(): string {
        return 'could not find key';
    }
}

// export function objLookup<T>(config: object, key: string): T | never;
// export function objLookup<T, D>(config: object, key: string, defaultValue: D): T | D;
// export function objLookup<T, D>(config: object, key: string, defaultValue: D = NO_ARG as any as D): T | D | NO_RESULT | never {
//     let node: any = config;
//     let allParts = key.split('.');
//     let parts: string[] = [...allParts]; // x.y.z => x, y, z
//     let unusedParts: string[] = [];
//     let selectedKeys: string[] = [];
//     while (true) {
//         const keys = Object.keys(node);
//         const joined = parts.join('.');
//         if (keys.includes(joined)) {
//             selectedKeys.push(joined);
//             if (unusedParts.length) { // desired node not-yet reached
//                 node = node[joined];
//                 if (isPlainObject(node[joined])) { // node is non-terminal (possible to traverse deeper)
//                     parts = [...unusedParts];
//                     unusedParts = [];
//                     return node;
//                 } else {
//                     throw new ConfigLookupError({ key, cfg: undefined } );
//                 }
//             } else { // desired node reached, return it's value
//                 if (isPlainObject(node[joined])) {
//                     objLookup(node[joined], joined)
//                 }
//                 return node[joined];
//             }
//         } else if (parts.length > 1) {
//             // given: x, y, z
//             const left = parts.slice(0, -1); // x, y
//             const right = parts.slice(-1); // z
//             unusedParts = [...right, ...unusedParts];
//             parts = [...left]; // will have 1 or more items
//         } else {
//             if (defaultValue !== NO_ARG) return defaultValue;
//             else return NO_RESULT; /// TODO ::: change behavior to throw in this case
//         }
//     }
// }

export function objLookup<T = any>(config: object, key: string): T | never;
export function objLookup<T = any, D = any>(config: object, key: string, defaultValue: D): T | D;
export function objLookup<T = any, D = any>(config: object, key: string, defaultValue: D = NO_ARG as any): T | D | never {
    let node: any = config;
    let allParts = key.split('.');
    let parts: string[] = [...allParts]; // x.y.z => x, y, z
    let unusedParts: string[] = [];
    do {
        const keys = Object.keys(node);
        const joined = parts.join('.');
        if (keys.includes(joined)) {
            if (unusedParts.length) { // desired node not-yet reached
                if (isPlainObject(node[joined])) { // node is non-terminal (possible to traverse deeper)
                    const value = objLookup(node[joined], unusedParts.join('.'), NO_RESULT);
                    if (value !== NO_RESULT) {
                        return value;
                    } // return goes back to body of do expression
                }
            } else { // desired node reached, return it's value
                return node[joined];
            }
        }
        // this pass didn't return a value.
        // lets try to access a parent node if one exists
        const left = parts.slice(0, -1); // x, y
        const right = parts.slice(-1); // z
        unusedParts = [...right, ...unusedParts];
        parts = [...left]; // will have 0 or more items
    } while (parts.length);
    // parts cannot be separated any further (ie: we are at root)
    if ((defaultValue as any) !== NO_ARG) return defaultValue;
    else {
        throw New
    }
}



export async function getUserConfig(): Promise<object>;
export async function getUserConfig(suppressErrors: boolean = true): Promise<object> {
    if (userConfigUri) {
        const content = await readFile(userConfigUri);
        return JSON6.parse(content);
    } else {
        throw new Error('VSCode user(global) config has not been located');
    }
}