import * as decache from 'decache';
import * as vscode from 'vscode';
import { CONFIG_PREFIX, CONFIG_ID_FRAGMENTS } from './extension';
import * as fsTools from './fsTools';
import * as _tsNode from 'ts-node';
import { substitute } from './substitution';
import { resolve } from 'dns';

let tsNode: typeof _tsNode | false = null;
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
export interface AutoResolverScript {
    autoResolve: SyncAutoResolver | AsyncAutoResolver;
}

export default async (): Promise<string | null> => {
    const activeFileUri = fsTools.getActiveFileUri();
    if (activeFileUri) {
        console.log(vscode.version);
        /// TODO ::: detect vscode < v1.18 and do not use activeFileUri overload
        const cfg: string = vscode.workspace.getConfiguration(CONFIG_PREFIX, activeFileUri).get(CONFIG_ID_FRAGMENTS.autoResolveScript);
        console.log('cfg:', cfg);
        if (typeof cfg === 'string' && cfg.length > 0) {
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
        console.log('no active file');
    }
    return null;
}