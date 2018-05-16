import * as mm from 'micromatch';
import { workspace, Uri } from 'vscode';

import { getActiveFileUri } from '../../compat/index';
import { getGlobResolverConfig } from './config';
import { substitute, SubstitutionContext } from '../../substitution';
import { GlobResolver, ExplicitGlobResolver, SingleGlob } from './schema';
import { showWarning, showInfo, showError } from '../../compat/message';


export default async (): Promise<string> => {
    const activeFile = getActiveFileUri();
    if (activeFile) {
        const cfg = getGlobResolverConfig(activeFile);
        console.log(cfg);
        if (cfg) {
            showInfo('config loaded');
            return '';
        } else {
            showError('Could not load configuration. Please check documentation to sample configurations.');
            return '';
        }
    } else {
        showWarning('No active editor');
        return '';
    }
};

