import { getters } from '@app/store';

export const getRelayHeaders = () => {
	const config = getters.config();
	const emhttp = getters.emhttp();
	const apiKey = config.remote.apikey;
	const serverName = emhttp.var.name;
	const serverVersion = emhttp.var.version;

	return {
		'x-api-key': apiKey,
		'x-flash-guid': emhttp.var.flashGuid,
		'x-server-name': serverName,
		'x-unraid-api-version': config.api.version,
		'x-unraid-server-version': serverVersion,
	};
};
