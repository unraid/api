import { apiManager } from '@app/core/api-manager';
import { varState } from '@app/core/states';
import { getters } from '@app/store';

export const getRelayHeaders = () => {
	const apiKey = apiManager.cloudKey!;
	const serverName = varState.data.name;
	const serverVersion = varState.data.version;

	return {
		'x-api-key': apiKey,
		'x-flash-guid': varState.data?.flashGuid,
		'x-server-name': serverName,
		'x-unraid-api-version': getters.config().version,
		'x-unraid-server-version': serverVersion,
	};
};
