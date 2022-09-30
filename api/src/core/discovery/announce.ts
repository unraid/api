import stw from 'spread-the-word';
import { boolToString } from '@app/core/utils';
import { AppError } from '@app/core/errors/app-error';
import { getters } from '@app/store';

/**
 * Announce to the local network via mDNS.
 */
export const announce = async (): Promise<void> => {
	const emhttp = getters.emhttp();
	const { name, localTld, version } = emhttp.var;

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
			requires_api_key: boolToString(false),
		},
	}).catch((error: Error) => {
		// We need to change our hostname
		if (error.message === 'service_exists') {
			throw new AppError('Hostname is taken.');
		}

		throw error;
	});
};
