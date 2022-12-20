import { startAppListening } from '@app/store/listeners/listener-middleware';
import { safelySerializeObjectToIni } from '@app/core/utils/files/safe-ini-serializer';
import { getWriteableConfig } from '@app/core/utils/files/config-file-normalizer';
import { writeFile } from 'fs/promises';
import { isAnyOf } from '@reduxjs/toolkit';
import { setUpnpState, setWanPortToValue, updateAccessTokens, updateUserConfig } from '@app/store/modules/config';
import { logger } from '@app/core/log';

export const enableConfigListener = () => startAppListening({
	matcher: isAnyOf(updateUserConfig, updateAccessTokens, setUpnpState, setWanPortToValue),
	async effect(_action, { getState }) {
		// Get state
		const state = getState();

		logger.debug('Writing config to disk');

		// Clean up config for writing
		const flashConfig = getWriteableConfig(state.config, 'flash');
		const memoryConfig = getWriteableConfig(state.config, 'memory');

		// Write state to disk
		await writeFile(state.paths['myservers-config'], safelySerializeObjectToIni(flashConfig));
		await writeFile(state.paths['myservers-config-states'], safelySerializeObjectToIni(memoryConfig));
	},
});
