import { safelySerializeObjectToIni } from '@app/core/utils/files/safe-ini-serializer';
import { FileLoadStatus } from '@app/store/types';
import { getWriteableConfig } from '@app/core/utils/files/config-file-normalizer';
import { store } from '@app/store';
import { writeFileSync } from 'fs';

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
