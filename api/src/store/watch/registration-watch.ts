import { watch } from 'chokidar';

import { keyServerLogger } from '@app/core/log.js';
import { getters, store } from '@app/store/index.js';
import { loadSingleStateFile } from '@app/store/modules/emhttp.js';
import { loadRegistrationKey } from '@app/store/modules/registration.js';
import { StateFileKey } from '@app/store/types.js';

const getRegistrationFingerprint = (): string => {
    const registration = getters.emhttp().var;

    return JSON.stringify({
        regCheck: registration?.regCheck,
        regFile: registration?.regFile,
        regState: registration?.regState,
        regTy: registration?.regTy,
    });
};

/**
 * Reloads var.ini with retry logic to handle timing issues with emhttpd.
 * When a key file changes, emhttpd needs time to process it and update var.ini.
 * This function retries loading var.ini until the registration state changes
 * or max retries are exhausted.
 */
export const reloadVarIniWithRetry = async (maxRetries = 3): Promise<void> => {
    const beforeFingerprint = getRegistrationFingerprint();

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const delay = 500 * Math.pow(2, attempt); // 500ms, 1s, 2s
        await new Promise((resolve) => setTimeout(resolve, delay));

        await store.dispatch(loadSingleStateFile(StateFileKey.var));

        const afterFingerprint = getRegistrationFingerprint();
        if (beforeFingerprint !== afterFingerprint) {
            keyServerLogger.info('Registration metadata updated after key file change');
            return;
        }
        keyServerLogger.debug(
            'Retry %d: registration metadata unchanged after key file change',
            attempt + 1
        );
    }
    keyServerLogger.debug(
        'Registration metadata unchanged after %d retries (may be expected)',
        maxRetries
    );
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

        // Reload var.ini first so regFile/regState reflect the latest key install/removal.
        await reloadVarIniWithRetry();

        await store.dispatch(loadRegistrationKey());
    });
};
