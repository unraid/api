import { logger } from '@app/core/log';
import { getters } from '@app/store';
import { Client } from '@runonflux/nat-upnp';

const upnpClient = new Client();

const parseWanPort = (wanport: string): number | null => {
	if (wanport && !isNaN(Number(wanport))) {
		return Number(wanport);
	}

	return null;
};

export const renewUpnpLease = async () => {
	const { remote: { wanport } } = getters.config();
	const { var: { useUpnp } } = getters.emhttp();
	const parsedWanPort = parseWanPort(wanport);
	logger.trace('Running UPNP Renewal Job', parsedWanPort, useUpnp);
	if (useUpnp && parsedWanPort) {
		try {
			logger.trace('Opening Port to WAN');
			const result = await upnpClient.createMapping({
				public: parsedWanPort,
				private: 443,
			});
			logger.debug('MAPPING RESULT %o', result);
		} catch (error: unknown) {
			logger.error('Failed sending keepalive message with error %s.', error);
		}
	}
};
