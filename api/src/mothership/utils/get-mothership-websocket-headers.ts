import { API_VERSION } from '@app/environment';
import { getters } from '@app/store';

export const getMothershipWebsocketHeaders = () => {
	const config = getters.config();
	const emhttp = getters.emhttp();
	const apiKey = config.remote.apikey;
	const serverName = emhttp.var.name;
	const serverVersion = emhttp.var.version;

	return {
		'x-api-key': apiKey,
		'x-flash-guid': emhttp.var.flashGuid,
		'x-server-name': serverName,
		'x-unraid-api-version': API_VERSION,
		'x-unraid-server-version': serverVersion,
	};
};
