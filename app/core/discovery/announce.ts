import stw from 'spread-the-word';
import { boolToString } from '../utils';
import { varState } from '../states';
import { AppError } from '../errors';

/**
 * Announce to the local network via mDNS.
 */
export const announce = async (): Promise<void> => {
	const name = varState.data?.name;
	const localTld = varState.data?.localTld;
	const version = varState.data?.version;

	if (!name || !localTld || !version) {
		throw new AppError('Missing require fields to announce.');
	}

	await stw.spread({
		name,
		type: 'unraid',
		subtypes: [],
		protocol: 'http',
		hostname: `${name}.${localTld}`,
		port: 80,
		txt: {
			is_setup: boolToString(false),
			version,
			// By default new servers won't need a key
			requires_api_key: boolToString(false)
		}
	}).catch(error => {
		// We need to change our hostname
		if (error.messae === 'service_exists') {
			throw new AppError('Hostname is taken.');
		}

		throw error;
	});
};
