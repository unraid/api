import { safelySerializeObjectToIni } from '@app/core/utils/files/safe-ini-serializer';
import { logger } from '@app/core/log';
import { FileLoadStatus, type StoreSubscriptionHandler } from '@app/store/types';
import { writeFile } from 'fs/promises';
import { getWriteableConfig } from '@app/core/utils/files/config-file-normalizer';
import { store } from '@app/store';
import isEqual from 'lodash/isEqual';
import { getDiff } from 'json-difference';
import { type MyServersConfig, type MyServersConfigMemory } from '@app/types/my-servers-config';
import { writeFileSync } from 'fs';

/**
 * @param oldConfig Last version of the config
 * @param newConfig Current version of the config
 * @param pathToConfig The path to write the newConfig to if it has changed
 */
const writeConfigIfChanged = async <T extends MyServersConfig | MyServersConfigMemory>(oldConfig: T | null, newConfig: T, pathToConfig: string) => {
	if (!isEqual(oldConfig, newConfig)) {
		logger.addContext('diff', getDiff(oldConfig ?? {}, newConfig, true));
		logger.trace('Dumping MyServers config back to: %s', pathToConfig);
		logger.removeContext('diff');

		// Stringify state
		const stringifiedData = safelySerializeObjectToIni(newConfig);

		// Update config file
		await writeFile(pathToConfig, stringifiedData);
	}
};

/**
 * Write the memory config synchronously, used on process exit
 * @returns void
 */
export const writeMemoryConfigSync = (): void => {
	const { config, paths } = store.getState();
	if (config.status !== FileLoadStatus.LOADED) return;

	const memoryConfig = getWriteableConfig(config, 'memory');
	const serializedMemoryConfig = safelySerializeObjectToIni(memoryConfig);
	writeFileSync(paths['myservers-config-states'], serializedMemoryConfig);
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
