import { writeFileSync } from 'fs';

import type { ConfigType } from '@app/core/utils/files/config-file-normalizer';
import { logger } from '@app/core/log';
import { getWriteableConfig } from '@app/core/utils/files/config-file-normalizer';
import { safelySerializeObjectToIni } from '@app/core/utils/files/safe-ini-serializer';
import { store } from '@app/store';
import { FileLoadStatus } from '@app/store/types';

export const writeConfigSync = (mode: ConfigType) => {
    const { config, paths } = store.getState();

    if (config.status !== FileLoadStatus.LOADED) {
        logger.warn('Configs not loaded, unable to write sync');
        return;
    }

    const writeableConfig = getWriteableConfig(config, mode);
    const path = mode === 'flash' ? paths['myservers-config'] : paths['myservers-config-states'];
    const serializedConfig = safelySerializeObjectToIni(writeableConfig);
    writeFileSync(path, serializedConfig);
};
