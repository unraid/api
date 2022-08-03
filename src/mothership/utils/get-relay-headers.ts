import { apiManager } from '@app/core/api-manager';
import { varState } from '@app/core/states';
import { version } from '@app/version';

export const getRelayHeaders = () => {
	const apiKey = apiManager.cloudKey!;
	const serverName = `${varState.data.name}`;

	return {
		'x-api-key': apiKey,
		'x-flash-guid': varState.data?.flashGuid,
		'x-server-name': serverName,
		'x-unraid-api-version': version,
	};
};
