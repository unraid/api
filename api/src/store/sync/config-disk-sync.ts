import { Serializer as IniSerializer } from 'multi-ini';
import { logger } from '@app/core/log';
import { FileLoadStatus, StoreSubscriptionHandler } from '@app/store/types';
import { writeFile } from 'fs/promises';
import { getWriteableConfig } from '@app/store/store-sync';
import { store } from '@app/store';
import isEqual from 'lodash/isEqual';
import { getDiff } from 'json-difference';

const serializer = new IniSerializer({
	// This ensures it ADDs quotes
	keep_quotes: false,
});

export const syncConfigToDisk: StoreSubscriptionHandler = async lastState => {
	const { config, paths } = store.getState();
	const configPath = paths['myservers-config'];
	if (config.status !== FileLoadStatus.LOADED) return;

	// Create new state
	const newConfig = getWriteableConfig(config);
	const oldConfig = lastState?.config ? getWriteableConfig(lastState.config) : null;

	// We already wrote this to the file
	if (isEqual(newConfig, oldConfig)) {
		return;
	}

	logger.addContext('diff', getDiff(oldConfig ?? {}, newConfig, true));
	logger.trace('Dumping MyServers config back to file');
	logger.removeContext('diff');

	// Stringify state
	const stringifiedData = serializer.serialize(newConfig);

	// Update config file
	await writeFile(configPath, stringifiedData);
};
