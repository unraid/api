import { safelySerializeObjectToIni } from '@app/core/utils/files/safe-ini-serializer';
import { logger } from '@app/core/log';
import { FileLoadStatus, StoreSubscriptionHandler } from '@app/store/types';
import { writeFile } from 'fs/promises';
import { getWriteableConfig } from '@app/store/store-sync';
import { store } from '@app/store';
import isEqual from 'lodash/isEqual';
import { getDiff } from 'json-difference';

export const syncConfigToDisk: StoreSubscriptionHandler = async lastState => {
	try {
		const { config, paths } = store.getState();
		const configPath = paths['myservers-config'];
		if (config.status !== FileLoadStatus.LOADED) return;

		// Create new state
		const newConfig = getWriteableConfig(config);
		const oldConfig = lastState?.config ? getWriteableConfig(lastState.config) : null;

		// We already wrote this to the file
		if (isEqual(newConfig, oldConfig)) return;

		logger.addContext('diff', getDiff(oldConfig ?? {}, newConfig, true));
		logger.trace('Dumping MyServers config back to file');
		logger.removeContext('diff');

		// Stringify state
		const stringifiedData = safelySerializeObjectToIni(newConfig);

		// Update config file
		await writeFile(configPath, stringifiedData);
	} catch (error: unknown) {
		if (!(error instanceof Error)) throw new Error(`Failed writing config to disk with unknown error "${String(error)}"`);
		logger.error('Failed writing config to disk with "%s"', error.message);
	}
};
