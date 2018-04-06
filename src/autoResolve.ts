import * as decache from 'decache';
import * as vscode from 'vscode';
import { CONFIG_IDs } from './extension';
import { fileExists, locatePath, getActiveFile, lastModified } from './fsTools';
import * as _tsNode from 'ts-node';
import { substitute } from './substitution';


let tsNode: typeof _tsNode | false = null;
let loadFailed: boolean = false;
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

export type SyncAutoResolver = (activeFilePath: string, ctx: ResolverContext) => string | false;
export type AsyncAutoResolver = (activeFilePath: string, ctx: ResolverContext) => Promise<string | false>;
export interface AutoResolverScript {
    autoResolve: SyncAutoResolver | AsyncAutoResolver;
}

export default async (): Promise<string> => {
    const activeFile = getActiveFile();
    if (activeFile) {
        const cfg: string = vscode.workspace.getConfiguration().get(CONFIG_IDs.autoResolveScript);
        if (typeof cfg === 'string' && cfg.length > 0) {
            const scriptPath = await locatePath(await substitute(cfg));
            console.log('scriptPath: ', scriptPath);
            if (scriptPath) { // check to see if script could be located
                 if (await ensureTsNode()) {
                    console.log('tsNode resolved:', tsNode);
                    let script: AutoResolverScript | null = null;
                    if (cacheInfo) { // first time using this command
                        if (loadFailed || cacheInfo.scriptPath === scriptPath && cacheInfo.timestamp !== await lastModified(scriptPath)) {
                            try {
                                decache(scriptPath); // remove any cached versions (so file changes are respected)
                                script = await import(scriptPath);
                            } catch(e) {
                                cacheInfo = null;
                                script = null;
                                console.log('clearing cache + reload auto resolve script failed', e);
                            }
                        } else { // script worked last time no, changes, so dont even bother reloading the script
                            script = cacheInfo.script;
                        }
                    } else {
                        try {
                            script = await import(scriptPath);
                        } catch(e) {
                            loadFailed = true;
                            script = null;
                            console.log('loading auto resolve script failed', e);
                        }
                    }
                    if (script) {
                        if ('autoResolve' in script && typeof script.autoResolve === 'function') {
                            loadFailed = false;
                            console.log('autoResolveScript matches expected shape', script);
                            let resolved: string | false = false;
                            try {
                                resolved = await script.autoResolve(activeFile, {} as any);
                            } catch (e) {
                                resolved = false;
                                console.log('autoResolve func failed:', e);
                            }
                            console.log('resolved value: ', resolved);
                            cacheInfo = {
                                script,
                                scriptPath,
                                timestamp: await lastModified(scriptPath)
                            };
                        } else {
                            loadFailed = true;
                            console.log('autoResolve function not exported by the imported script');
                        }
                    } else {
                        loadFailed = true;
                        console.log('autoResolve script could not be required');
                    }
                } else {
                    console.log('tsNode failed to load', );
                    throw new Error('cant load tsNode!');
                }
            } else {
                throw new Error('cannot find script');
            }
        } else {
            console.log('cannot auto resolve, no autoResolveScript');
        }
    } else {
        throw new Error('Cannot get activeFile!');
    }
    return '';
}