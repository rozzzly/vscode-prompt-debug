import * as mm from 'micromatch';

import { workspace, Uri } from 'vscode';
import { getActiveFileUri } from '../../compat';
import { getGlobResolverConfig } from './config';
import { GlobResolver, ExplicitGlobResolver, SubbedExplicitGlobResolver } from './schema';
import { substitute } from '../../substitution';


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

async function substituteInput(resource: Uri, resolver: ExplicitGlobResolver): Promise<SubbedExplicitGlobResolver | null> {
    const subbed = await substitute(resolver.input);
    return { ...resolver, subbedInput: subbed };
}

export function inputMatches(resource: Uri, resolver: ExplicitGlobResolver): boolean {
    
}