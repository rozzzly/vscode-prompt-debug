import * as mm from 'micromatch';

import { workspace, Uri } from 'vscode';
import { getActiveFileUri } from '../../fsTools';
import { getGlobResolverConfig, GlobResolver, ExplicitGlobResolver } from './config';
import { resolve } from 'url';


export default async (): Promise<string> => {
    const activeFile = getActiveFileUri();
    if (activeFile) {
        const cfg = getGlobResolverConfig(activeFile);
        console.log(cfg);
    } else {
        throw new URIError('No activeFile');
    }
    return '';
};


export function matchGlob(resource: Uri, resolvers: GlobResolver[]): ExplicitGlobResolver[] {
    const results: ExplicitGlobResolver[] = [];

    return [];
}