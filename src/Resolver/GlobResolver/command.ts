import { getActiveFileUri } from '../../compat';
import { getGlobResolverConfig } from './config';
import { showWarning, showInfo, showError } from '../../compat/message';
import { firstMatchingResolver } from './glob';


export default async (): Promise<string> => {
    const activeFile = getActiveFileUri();
    if (activeFile) {
        const cfg = getGlobResolverConfig(activeFile);
        console.log(cfg);
        if (cfg) {
            const resolver = firstMatchingResolver(cfg, activeFile);
            if (resolver) {
                return '';
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

