import { safelySerializeObjectToIni } from '@app/core/utils/files/safe-ini-serializer';
import { FileLoadStatus } from '@app/store/types';
import { type ConfigType, getWriteableConfig } from '@app/core/utils/files/config-file-normalizer';
import { store } from '@app/store';
import { writeFileSync } from 'fs';
import { logger } from '@app/core/log';

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

