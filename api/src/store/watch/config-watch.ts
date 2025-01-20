import { existsSync, writeFileSync } from 'fs';

import { watch } from 'chokidar';

import { logger } from '@app/core/log';
import { getWriteableConfig } from '@app/core/utils/files/config-file-normalizer';
import { safelySerializeObjectToIni } from '@app/core/utils/files/safe-ini-serializer';
import { CHOKIDAR_USEPOLLING, ENVIRONMENT } from '@app/environment';
import { getters, store } from '@app/store';
import { initialState, loadConfigFile, logoutUser } from '@app/store/modules/config';

export const setupConfigPathWatch = () => {
    const myServersConfigPath = getters.paths()?.['myservers-config'];
    if (myServersConfigPath) {
        logger.info('Watch Setup on Config Path: %s', myServersConfigPath);
        if (!existsSync(myServersConfigPath)) {
            const config = safelySerializeObjectToIni(getWriteableConfig(initialState, 'flash'));
            writeFileSync(myServersConfigPath, config, 'utf-8');
        }
        const watcher = watch(myServersConfigPath, {
            persistent: true,
            ignoreInitial: false,
            usePolling: CHOKIDAR_USEPOLLING === true,
        })
            .on('change', async (change) => {
                logger.trace('Config File Changed, Reloading Config %s', change);
                await store.dispatch(loadConfigFile());
            })
            .on('unlink', async () => {
                const config = safelySerializeObjectToIni(getWriteableConfig(initialState, 'flash'));
                await writeFileSync(myServersConfigPath, config, 'utf-8');
                watcher.close();
                setupConfigPathWatch();
                store.dispatch(logoutUser({ reason: 'Config File was Deleted' }));
            });
    } else {
        logger.error('[FATAL] Failed to setup watch on My Servers Config (Could Not Read Config Path)');
    }
};
