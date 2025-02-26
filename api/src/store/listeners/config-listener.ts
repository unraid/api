import { writeFileSync } from 'fs';

import type { ConfigType } from '@app/core/utils/files/config-file-normalizer.js';
import { logger } from '@app/core/log.js';
import { getWriteableConfig } from '@app/core/utils/files/config-file-normalizer.js';
import { safelySerializeObjectToIni } from '@app/core/utils/files/safe-ini-serializer.js';
import { startAppListening } from '@app/store/listeners/listener-middleware.js';
import { configUpdateActionsFlash, configUpdateActionsMemory } from '@app/store/modules/config.js';

export const enableConfigFileListener = (mode: ConfigType) => () =>
    startAppListening({
        matcher: mode === 'flash' ? configUpdateActionsFlash : configUpdateActionsMemory,
        async effect(_, { getState }) {
            const { paths, config } = getState();
            const pathToWrite =
                mode === 'flash' ? paths['myservers-config'] : paths['myservers-config-states'];
            const writeableConfig = getWriteableConfig(config, mode);
            const serializedConfig = safelySerializeObjectToIni(writeableConfig);
            logger.debug('Writing updated config to %s', pathToWrite);
            writeFileSync(pathToWrite, serializedConfig);
        },
    });
