import { startAppListening } from '@app/store/listeners/listener-middleware';
import { getDiff } from 'json-difference';
import { isEqual } from 'lodash';
import { logger } from '@app/core/log';
import { type ConfigType, getWriteableConfig } from '@app/core/utils/files/config-file-normalizer';
import { loadConfigFile } from '@app/store/modules/config';
import { writeFile } from 'fs/promises';
import { FileLoadStatus } from '../types';
import { safelySerializeObjectToIni } from '../../core/utils/files/safe-ini-serializer';

export const enableConfigFileListener = (mode: ConfigType) => () => startAppListening({
	predicate(action, currentState, previousState) {
		if (currentState.config.status === FileLoadStatus.LOADED) {
			const oldFlashConfig = previousState?.config ? getWriteableConfig(previousState.config, mode) : null;
			const newFlashConfig = getWriteableConfig(currentState.config, mode);
			if (!isEqual(oldFlashConfig, newFlashConfig) && action.type !== loadConfigFile.fulfilled.type) {
				logger.addContext('configDiff', getDiff(oldFlashConfig ?? {}, newFlashConfig));
				logger.trace(`${mode} Config Changed!`, 'Action:', action.type);
				logger.removeContext('configDiff');

				return true;
			}
		}

		return false;
	}, async effect(_, { getState }) {
		const pathToWrite = mode === 'flash' ? getState().paths['myservers-config'] : getState().paths['myservers-config-states'];
		const writeableConfig = getWriteableConfig(getState().config, mode);
		const serializedConfig = safelySerializeObjectToIni(writeableConfig);
		logger.debug('Writing updated config to', pathToWrite);
		await writeFile(pathToWrite, serializedConfig);
	},
});

