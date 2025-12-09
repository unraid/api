import { watch } from 'chokidar';

import { keyServerLogger } from '@app/core/log.js';
import { getters, store } from '@app/store/index.js';
import { loadSingleStateFile } from '@app/store/modules/emhttp.js';
import { loadRegistrationKey } from '@app/store/modules/registration.js';
import { StateFileKey } from '@app/store/types.js';

/**
 * Reloads var.ini with retry logic to handle timing issues with emhttpd.
 * When a key file changes, emhttpd needs time to process it and update var.ini.
 * This function retries loading var.ini until the registration state changes
 * or max retries are exhausted.
 */
export const reloadVarIniWithRetry = async (maxRetries = 3): Promise<void> => {
    const beforeState = getters.emhttp().var?.regTy;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const delay = 500 * Math.pow(2, attempt); // 500ms, 1s, 2s
        await new Promise((resolve) => setTimeout(resolve, delay));

        await store.dispatch(loadSingleStateFile(StateFileKey.var));

        const afterState = getters.emhttp().var?.regTy;
        if (beforeState !== afterState) {
            keyServerLogger.info('Registration state updated: %s -> %s', beforeState, afterState);
            return;
        }
        keyServerLogger.debug('Retry %d: var.ini regTy still %s', attempt + 1, afterState);
    }
    keyServerLogger.debug('var.ini regTy unchanged after %d retries (may be expected)', maxRetries);
};

export const setupRegistrationKeyWatch = () => {
    // IMPORTANT: /boot/config is on FAT32 flash drive which does NOT support inotify
    // Must use polling to detect file changes on FAT32 filesystems
    watch('/boot/config', {
        persistent: true,
        ignoreInitial: true,
        ignored: (path: string) => !path.endsWith('.key'),
        usePolling: true, // Required for FAT32 - inotify doesn't work
        interval: 5000, // Poll every 5 seconds (balance between responsiveness and CPU usage)
    }).on('all', async (event, path) => {
        keyServerLogger.info('Key file %s: %s', event, path);

        await store.dispatch(loadRegistrationKey());

        // Reload var.ini to get updated registration metadata from emhttpd
        await reloadVarIniWithRetry();
    });
};
