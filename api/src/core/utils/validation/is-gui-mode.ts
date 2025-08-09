import { execa } from 'execa';

import { internalLogger } from '@app/core/log.js';

/**
 * Check if Unraid is in GUI mode by looking for the slim process.
 * @returns true if Unraid is in GUI mode, false otherwise.
 */
const isGuiMode = async (): Promise<boolean> => {
    try {
        // Use pgrep to check if slim process is running
        const { exitCode } = await execa('pgrep', ['slim'], { reject: false });
        // exitCode 0 means process was found, 1 means not found
        return exitCode === 0;
    } catch (error) {
        internalLogger.error('Error checking GUI mode: %o', error as object);
        return false;
    }
};

export default isGuiMode;
