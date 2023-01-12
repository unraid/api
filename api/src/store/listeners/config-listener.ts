import { startAppListening } from '@app/store/listeners/listener-middleware';
import { getDiff } from 'json-difference';
import { isEqual } from 'lodash';
import { logger } from '@app/core/log';
import { type ConfigType, getWriteableConfig } from '@app/core/utils/files/config-file-normalizer';
import { loadConfigFile, loginUser, logoutUser } from '@app/store/modules/config';
import { writeFileSync } from 'fs';
import { FileLoadStatus } from '@app/store/types';
import { safelySerializeObjectToIni } from '@app/core/utils/files/safe-ini-serializer';
import { isFulfilled } from '@reduxjs/toolkit';

const actionIsLoginOrLogout = isFulfilled(logoutUser, loginUser);

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

			if (actionIsLoginOrLogout(action) && mode === 'memory') {
				logger.trace('Logout / Login Action Encountered, writing memory config');
				return true;
			}
		}

		return false;
	}, effect(_, { getState }) {
		const { paths, config } = getState();
		const pathToWrite = mode === 'flash' ? paths['myservers-config'] : paths['myservers-config-states'];
		const writeableConfig = getWriteableConfig(config, mode);
		const serializedConfig = safelySerializeObjectToIni(writeableConfig);
		logger.debug('Writing updated config to', pathToWrite);
		writeFileSync(pathToWrite, serializedConfig);
	},
});

