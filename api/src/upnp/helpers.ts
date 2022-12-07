import { logger, upnpLogger } from '@app/core/log';
import { getters, store } from '@app/store';
import { setError, type LeaseRenewalArgs } from '@app/store/modules/upnp';
import { Client } from '@runonflux/nat-upnp';

const upnpClient = new Client();

const SIX_HOURS = 60 * 60 * 6;

export const parseStringToNumberOrNull = (myString: string): number | null => {
	if (myString && !isNaN(Number(myString))) {
		return Number(myString);
	}

	logger.error('Failed to parse "%s" to a number!', myString);
	return null;
};

export const renewUpnpLease = async ({ localPortForUpnp, wanPortForUpnp } = getters.upnp() as LeaseRenewalArgs) => {
	upnpLogger.trace('Running UPNP Renewal Job. Local Port: [%s] Remote Port [%s]', localPortForUpnp, wanPortForUpnp);
	if (localPortForUpnp && wanPortForUpnp) {
		try {
			const result = await upnpClient.createMapping({
				public: wanPortForUpnp,
				private: localPortForUpnp,
				description: 'Unraid API UPNP',
				ttl: SIX_HOURS,
			});
			upnpLogger.trace('Opening Port Result %o', result);
			await upnpClient.getMappings();
		} catch (error: unknown) {
			upnpLogger.error('UPNP Renewal Failed with Error %o.', error);
			store.dispatch(setError(error));
		}
	}
};

export const getUpnpMappings = async () => upnpClient.getMappings();

export const removeUpnpLease = async ({ localPortForUpnp, wanPortForUpnp } = getters.upnp() as LeaseRenewalArgs) => {
	upnpLogger.warn('REMOVING UPNP LEASE FOR PORT %s', wanPortForUpnp);

	if (wanPortForUpnp && localPortForUpnp) {
		try {
			const result = await upnpClient.removeMapping({
				public: wanPortForUpnp,
				private: localPortForUpnp,
			});

			upnpLogger.trace('UPNP Removal Result %o', result);
		} catch (error: unknown) {
			upnpLogger.error('UPNP Removal Failed with Error %o.', error);
		}
	}
};
