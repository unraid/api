import { ONE_HOUR_SECS, THIRTY_SECONDS_MS } from '@app/consts';
import { upnpLogger } from '@app/core/log';
import { IS_DOCKER } from '@app/environment';
import { convertToFuzzyTime } from '@app/mothership/utils/convert-to-fuzzy-time';
import { getters } from '@app/store';
import { type LeaseRenewalArgs } from '@app/store/modules/upnp';
import { MockUpnpClient } from '@app/upnp/mock-upnp-client';
import { Client, type Mapping } from '@runonflux/nat-upnp';

// If we're in docker mode, load the mock client
const upnpClient = IS_DOCKER ? new MockUpnpClient({ timeout: THIRTY_SECONDS_MS }) : new Client({
	timeout: THIRTY_SECONDS_MS,
});

const PORT_RANGE_MIN = 35_000;
const PORT_RANGE_MAX = 65_000;

export const getWanPortForUpnp = (mappings: Mapping[] | null, minPort = PORT_RANGE_MIN, maxPort = PORT_RANGE_MAX): number | null => {
	const excludedPorts = mappings?.map(val => val.public.port);
	// Attempt to get a port 50 times, then fail
	for (let i = 0; i < 50; i += 1) {
		const port = convertToFuzzyTime(minPort, maxPort);
		if (!excludedPorts?.includes(port)) {
			return port;
		}
	}

	return null;
};

/**
 * @param param0 { localPortForUpnp, wanPortForUpnp }
 * @returns void
 * @throws Error, if renewal fails
 */
export const renewUpnpLease = async ({ localPortForUpnp, wanPortForUpnp, serverName }: { localPortForUpnp: number; wanPortForUpnp: number; serverName?: string }): Promise<void> => {
	upnpLogger.info('Renewing UPNP Lease: Public Port [%s] Local Port [%s]', wanPortForUpnp, localPortForUpnp);
	const result = await upnpClient.createMapping({
		public: wanPortForUpnp,
		private: localPortForUpnp,
		description: `Unraid Remote Access - ${serverName ?? 'No Server Name Found'}`,
		ttl: ONE_HOUR_SECS,
	});
	upnpLogger.trace('Opening Port Result %o', result);
};

/**
 * Get the upnp mappings that are already configured for the router
 * @returns Array of already mapped ports, null if failure occurs
 */
export const getUpnpMappings = async (): Promise<Mapping[] | null> => {
	upnpLogger.trace('Fetching UPNP Mappings');

	try {
		const mappings = await upnpClient.getMappings();

		return mappings;
	} catch (error: unknown) {
		upnpLogger.warn(`Caught error [${error instanceof Error ? error.message : 'N/A'}] fetching current UPNP mappings`);
	}

	return null;
};

/**
 * Remove a UPNP lease
 * @param param0 { localPortForUpnp, wanPortForUpnp }
 * @throws Error if the removal fails
 */
export const removeUpnpLease = async ({ localPortForUpnp, wanPortForUpnp } = getters.upnp() as LeaseRenewalArgs): Promise<void> => {
	upnpLogger.warn('Removing UPNP Lease: Public Port [%s] Local Port [%s]', wanPortForUpnp, localPortForUpnp);

	const result = await upnpClient.removeMapping({
		public: wanPortForUpnp,
		private: localPortForUpnp,
	});

	upnpLogger.trace('UPNP Removal Result %o', result);
};
