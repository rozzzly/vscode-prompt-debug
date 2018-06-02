import { getActiveFileUri } from '../../compat';
import { getGlobResolverConfig } from './config';
import { showWarning, showError } from '../../compat/message';
import { firstMatch } from './glob';


export default async (): Promise<string> => {
    const activeFile = getActiveFileUri();
    if (activeFile) {
        const cfg = getGlobResolverConfig(activeFile);
        console.log(cfg);
        if (cfg) {
            const resolved = await firstMatch(cfg, activeFile);
            if (resolved) {
                console.log({ resolved });
                return resolved.outputUri.fsPath;
            } else {
                console.info({ cfg, activeFile });
                showError('No defined GlobResolver matches this resource.');
                return '';
            }
        } else {
            showError('Could not load configuration. Please check documentation to sample configurations.');
            return '';
        }
    } else {
        showWarning('No active editor');
        return '';
    }
};

