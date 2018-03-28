import * as decache from 'decache';
import * as vscode from 'vscode';
import { CONFIG_IDs } from './extension';
import { fileExists, locate, getActiveFile, lastModified } from './fsTools';
import * as _tsNode from 'ts-node';


let tsNode: typeof _tsNode | false = null;
let cacheInfo: { scriptPath: string; timestamp: number; script: AutoResolverScript; } | null = null;

async function ensureTsNode(): Promise<boolean> {
    if (tsNode) { // ts node has already been loaded
        return true;
    } else if (tsNode === null) { // never tried to load ts-node
        try {
            tsNode = await import('ts-node');
            tsNode.register({
                cache: false,
                typeCheck: false
            });
        } catch (e) {
            console.log('tsNode require patch failed', e);
            tsNode = false;
        }
        return tsNode !== false;
    } else if (tsNode === false) { // loading ts-node failed
        return false;
    } else {
        throw new TypeError('unexpected value')
    }
}

export interface ResolverContext {
    workspaceFolder: string;
    relativeTo(baseDir: string): string;
    isSubDirectoryOf(filePath: string, parentDir: string): boolean;
    exists(filePath: string): Promise<boolean>;
}

export type AutoResolver = (activeFilePath: string, ctx: ResolverContext) => Promise<string | false>;
export interface AutoResolverScript {
    autoResolve: AutoResolver;
}

export default async (): Promise<string> => {
    const activeFile = getActiveFile();
    if (activeFile) {
        const cfg: string = vscode.workspace.getConfiguration().get(CONFIG_IDs.autoResolveScript);
        if (typeof cfg === 'string' && cfg.length > 0) {
            const scriptPath = await locate(cfg);
            console.log('scriptPath: ', scriptPath);
            if (await ensureTsNode()) {
                console.log('tsNode resolved:', tsNode);
                if (scriptPath) {
                    let script: AutoResolverScript | false = false;
                    try {
                        if (!cacheInfo) { // first time using this command
                            script = await import(scriptPath);
                        } else if (cacheInfo.timestamp === await lastModified(scriptPath)) {
                            script = cacheInfo.script; // no changes, so dont even bother reloading the script
                        } else {
                            decache(scriptPath); // remove any cached versions (so file changes are respected)
                            script = await import(scriptPath);
                        }
                    } catch(e) {
                        script = false;
                        console.log('importing auto resolve script failed', e);
                    }
                    if (script) {
                        if ('autoResolve' in script && typeof script.autoResolve === 'function') {
                            console.log('autoResolveScript matches expected shape', script);
                            let resolved: string | false = false;
                            try {
                                resolved = await script.autoResolve(activeFile, {} as any);
                            } catch (e) {
                                resolved = false;
                                console.log('autoResolve func failed:', e);
                            }
                            console.log('resolved value: ', resolved);
                        } else {
                            console.log('autoResolve function not exported by the imported script');
                        }
                        cacheInfo = {
                            script,
                            scriptPath,
                            timestamp: await lastModified(scriptPath)
                        };
                    } else {
                        cacheInfo = null;
                        console.log('autoResolve script could not be required');
                    }
                } else {
                    throw new Error('cannot find script');
                }
            } else {
                console.log('tsNode failed to load', );
                throw new Error('cant load tsNode!');
            }
        } else {
            console.log('cannot auto resolve, no autoResolveScript');
        }
    } else {
        throw new Error('Cannot get activeFile!');
    }
    return '';
}