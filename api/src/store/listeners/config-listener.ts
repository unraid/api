import { writeFileSync } from 'fs';


import type { ConfigType } from '@app/core/utils/files/config-file-normalizer';
import { logger } from '@app/core/log';
import { getWriteableConfig } from '@app/core/utils/files/config-file-normalizer';
import { safelySerializeObjectToIni } from '@app/core/utils/files/safe-ini-serializer';
import { startAppListening } from '@app/store/listeners/listener-middleware';
import { configUpdateActionsFlash, configUpdateActionsMemory } from '@app/store/modules/config';

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
