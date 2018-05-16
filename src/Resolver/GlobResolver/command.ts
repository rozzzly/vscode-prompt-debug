import { getActiveFileUri } from '../../compat';
import { getGlobResolverConfig } from './config';
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

