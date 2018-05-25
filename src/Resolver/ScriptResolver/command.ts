import * as decache from 'decache';
import { Uri } from 'vscode';
import { CONFIG_ID_FRAGMENTS, CONFIG_IDs } from '../../constants';
import * as fsTools from '../../fsTools';
import * as _tsNode from 'ts-node';
import { substitute } from '../../substitution';
import { getUserConfig, getActiveFileUri } from '../../compat';
import { ScriptResolverScript } from '../ScriptResolver';

let tsNode: typeof _tsNode | null | false = null;
let loadFailed: boolean = false;
let cacheInfo: { scriptPath: string; timestamp: number; script: ScriptResolverScript; } | null = null;

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
        throw new TypeError('unexpected value');
    }
}


export default async (): Promise<string | null> => {
const activeFileUri = getActiveFileUri();
    if (activeFileUri) {
        const cfg = ''; //getUserConfig(activeFileUri).get<string>(CONFIG_IDs.scriptResolver);
        console.log('cfg:', cfg);
        if (typeof cfg === 'string' && cfg.length > 0) {
            console.log('before resolveToPath');
            const scriptUri = await fsTools.resolveToUri(await substitute(cfg));
            console.log('scriptPath: ', scriptUri);
            if (scriptUri) { // check to see if script could be located
                 if (await ensureTsNode()) {
                    console.log('tsNode resolved:', tsNode);
                    let script: ScriptResolverScript | null = null;
                    if (cacheInfo) { // first time using this command
                        if (loadFailed || cacheInfo.scriptPath === scriptUri.fsPath && cacheInfo.timestamp !== await fsTools.lastModified(scriptUri)) {
                            try {
                                decache(scriptUri); // remove any cached versions (so file changes are respected)
                                script = await import(scriptUri.fsPath);
                            } catch (e) {
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
                            script = await import(scriptUri.fsPath);
                        } catch (e) {
                            loadFailed = true;
                            script = null;
                            console.log('loading auto resolve script failed', e);
                        }
                    }
                    if (script) {
                        if ('resolve' in script && typeof script.resolve === 'function') {
                            loadFailed = false;
                            console.log('autoResolveScript matches expected shape', script);
                            let resolved: string | Uri | null = null;
                            try {
                                resolved = await script.resolve(activeFileUri.fsPath, {} as any);
                            } catch (e) {
                                resolved = null;
                                console.log('autoResolve func failed:', e);
                            }
                            console.log('resolved value: ', resolved);
                            cacheInfo = {
                                script,
                                scriptPath: scriptUri.fsPath,
                                timestamp: await fsTools.lastModified(scriptUri, false)
                            };
                            if (resolved instanceof Uri) {
                                return resolved.fsPath;
                            } else {
                                return resolved;
                            }
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
};