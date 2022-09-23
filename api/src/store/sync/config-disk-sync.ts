import { logger } from '@app/core/log';
import { FileLoadStatus, StoreSubscriptionHandler } from '@app/store/types';
import { writeFile } from 'fs/promises';
import { getWriteableConfig } from '@app/store/store-sync';
import { store } from '@app/store';
import isEqual from 'lodash/isEqual';
import { getDiff } from 'json-difference';
import { stringify } from 'ini';

export const syncConfigToDisk: StoreSubscriptionHandler = async lastState => {
	const { config, paths } = store.getState();
	const configPath = paths['myservers-config'];
	if (config.status !== FileLoadStatus.LOADED) return;

	// Create new state
	const newConfig = getWriteableConfig(config);
	const oldConfig = lastState?.config ? getWriteableConfig(lastState.config) : null;

	// We already wrote this to the file
	if (isEqual(newConfig, oldConfig)) {
		logger.debug('Not dumping config, state on disk is the same');
		return;
	}

	logger.debug('Dumping MyServers config back to file');
	logger.trace(getDiff(oldConfig ?? {}, newConfig, true));

	// Stringify state
	const stringifiedData = stringify(newConfig);

	// Update config file
	await writeFile(configPath, stringifiedData);
};
