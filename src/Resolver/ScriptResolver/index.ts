import * as fsTools from '../../fsTools';
import { Uri } from 'vscode';

export type FsTools = typeof fsTools;
export interface ResolverContext extends FsTools {
}

export type SyncScriptResolver = (activeFilePath: string, ctx: ResolverContext) => string | Uri | null;
export type AsyncScriptResolver = (activeFilePath: string, ctx: ResolverContext) => Promise<string | Uri | null>;
export type ScriptResolver = (
    | SyncScriptResolver
    | AsyncScriptResolver
);

export interface ScriptResolverScript {
    resolve: ScriptResolver;
}