import * as fsTools from '../fsTools';


export type FsTools = typeof fsTools;
export interface ResolverContext extends FsTools {
}

export type SyncAutoResolver = (activeFilePath: string, ctx: ResolverContext) => string | null;
export type AsyncAutoResolver = (activeFilePath: string, ctx: ResolverContext) => Promise<string | null>;
export type AutoResolver = SyncAutoResolver | AsyncAutoResolver;
export interface AutoResolverScript {
    autoResolve: AutoResolver;
}