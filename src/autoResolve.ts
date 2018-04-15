import * as decache from 'decache';
import * as vscode from 'vscode';
import { CONFIG_ID_FRAGMENTS, CONFIG_IDs } from './constants';
import * as fsTools from './fsTools';
import * as _tsNode from 'ts-node';
import { substitute } from './substitution';
import { resolve } from 'dns';
import { config } from './compat';

let tsNode: typeof _tsNode | null | false = null;
let loadFailed: boolean = false;
let cacheInfo: { scriptPath: string; timestamp: number; script: AutoResolverScript; } | null = null;

async function ensureTsNode(): Promise<boolean> {
    if (tsNode) { // ts node has already been loaded
        return true;
    } else if (tsNode === null) { // nev tried to load ts-node
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
export type FsTools = typeof fsTools;
export interface ResolverContext extends FsTools {
}

export type SyncAutoResolver = (activeFilePath: string, ctx: ResolverContext) => string | null;
export type AsyncAutoResolver = (activeFilePath: string, ctx: ResolverContext) => Promise<string | null>;
export type AutoResolver = SyncAutoResolver | AsyncAutoResolver;
export interface AutoResolverScript {
    autoResolve: AutoResolver;
}

export default async (): Promise<string | null> => {
    const activeFileUri = fsTools.getActiveFileUri();
    if (activeFileUri) {
        const cfg = config(activeFileUri).get<string>(CONFIG_IDs.autoResolveScript)
        console.log('cfg:', cfg);
        if (typeof cfg === 'string' && cfg.length > 0) {
            console.log('before resolveToPath')
            const scriptPath = await fsTools.resolveToPath(await substitute(cfg));
            console.log('scriptPath: ', scriptPath);
            if (scriptPath) { // check to see if script could be located
                 if (await ensureTsNode()) {
                    console.log('tsNode resolved:', tsNode);
                    let script: AutoResolverScript | null = null;
                    if (cacheInfo) { // first time using this command
                        if (loadFailed || cacheInfo.scriptPath === scriptPath && cacheInfo.timestamp !== await fsTools.lastModified(scriptPath)) {
                            try {
                                decache(scriptPath); // remove any cached versions (so file changes are respected)
                                script = await import(scriptPath);
                            } catch(e) {
                                cacheInfo = null;
                                loadFailed = true;
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
                            let resolved: string | null = null;
                            try {
                                resolved = await script.autoResolve(activeFileUri.fsPath, {} as any);
                            } catch (e) {
                                resolved = null;
                                console.log('autoResolve func failed:', e);
                            }
                            console.log('resolved value: ', resolved);
                            cacheInfo = {
                                script,
                                scriptPath,
                                timestamp: await fsTools.lastModified(scriptPath)
                            };
                            return resolved;
                        } else {
                            loadFailed = true;
                            throw new Error('autoResolve function not exported by the imported script');
                        }
                    } else {
                        loadFailed = true;
                        throw new Error('autoResolve script could not be required');
                    }
                } else {
                    throw new Error('cannot load tsNode!');
                }
            } else {
                throw new Error('cannot find script');
            }
        } else {
            throw new Error('cannot auto resolve, no autoResolveScript');
        }
    } else {
        throw new Error('no active file');
    }
}