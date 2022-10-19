import { safelySerializeObjectToIni } from '@app/core/utils/files/safe-ini-serializer';
import { logger } from '@app/core/log';
import { FileLoadStatus, StoreSubscriptionHandler } from '@app/store/types';
import { writeFile } from 'fs/promises';
import { getWriteableConfig } from '@app/core/utils/files/config-file-normalizer';
import { store } from '@app/store';
import isEqual from 'lodash/isEqual';
import { getDiff } from 'json-difference';
import { MyServersConfig, MyServersConfigMemory } from '@app/types/my-servers-config';

const writeConfigIfChanged = async <T extends MyServersConfig | MyServersConfigMemory>(oldConfig: T | null, newConfig: T, pathToConfig: string) => {
	if (!isEqual(oldConfig, newConfig)) {
		logger.addContext('diff', getDiff(oldConfig ?? {}, newConfig, true));
		logger.trace('Dumping MyServers config back to file');
		logger.removeContext('diff');

		// Stringify state
		const stringifiedData = safelySerializeObjectToIni(newConfig);

		// Update config file
		await writeFile(pathToConfig, stringifiedData);
	}
};

export const syncConfigToDisk: StoreSubscriptionHandler = async lastState => {
	const { config, paths } = store.getState();
	if (config.status !== FileLoadStatus.LOADED) return;

	// Create new state
	const oldFlashConfig = lastState?.config ? getWriteableConfig(lastState.config, 'flash') : null;
	const newFlashConfig = getWriteableConfig(config, 'flash');
	// Create new memory state
	const oldMemoryConfig = lastState?.config ? getWriteableConfig(lastState.config, 'memory') : null;
	const newMemoryConfig = getWriteableConfig(config, 'memory');

	const flashConfigWriter = writeConfigIfChanged(
		oldFlashConfig, newFlashConfig, paths['myservers-config'],
	);
	const memoryConfigWriter = writeConfigIfChanged(
		oldMemoryConfig, newMemoryConfig, paths['myservers-config-states'],
	);
	await Promise.all([flashConfigWriter, memoryConfigWriter]);
};
