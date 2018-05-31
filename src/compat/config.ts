import * as JSON6 from 'json-6';
import * as path from 'path';

import {
    Uri,
    workspace,
    ExtensionContext,
    WorkspaceConfiguration
} from 'vscode';

import { readFile, dirExists, fileExists } from '../fsTools';
import { PREFIX } from '../constants';
import { isMultiRootSupported } from '../compat';

export function getConfig(resource?: Uri): WorkspaceConfiguration {
    if (resource && isMultiRootSupported) {
        return workspace.getConfiguration(PREFIX, resource);
    } else {
        return workspace.getConfiguration(PREFIX);
    }
}

export let userConfigUri: Uri | null = null;

export async function findUserConfig(context: ExtensionContext): Promise<Uri | null> {
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
                return null;
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
export const configKeyNotFound: unique symbol = Symbol('configKeyNotFound'); /// TODO ::: namespace this
export type configKeyNotFound = typeof configKeyNotFound; /// TODO ::: namespace this

export function objLookup<T>(config: object, key: string): T;
export function objLookup<T, D>(config: object, key: string, defaultValue: D): T | D;
export function objLookup<T>(config: object, key: string, defaultValue: T | configKeyNotFound = configKeyNotFound): T | configKeyNotFound {
    let node: any = config;
    let allParts = key.split('.');
    let parts: string[] = [...allParts]; // x.y.z => x, y, z
    let unusedParts: string[] = [];
    let selectedKeys: string[] = [];
    while (true) {
        const keys = Object.keys(node);
        const joined = parts.join('.');
        if (keys.includes(joined)) {
            selectedKeys.push(joined);
            if (unusedParts.length) {
                node = node[joined];
                parts = [...unusedParts];
                unusedParts = [];
            } else {
                return node[joined];
            }
        } else if (parts.length > 1) {
            // given: x, y, z
            const left = parts.slice(0, -1); // x, y
            const right = parts.slice(-1); // z
            unusedParts = [...right, ...unusedParts];
            parts = [...left]; // will have 1 or more items
        } else {
            if (defaultValue !== configKeyNotFound) return defaultValue;
            else return configKeyNotFound; /// TODO ::: change behavior to throw in this case
        }
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