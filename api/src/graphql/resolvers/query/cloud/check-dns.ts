/*!
 * Copyright 2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { MOTHERSHIP_GRAPHQL_LINK } from '@app/consts';
import { store } from '@app/store';
import { getDnsCache } from '@app/store/getters';
import { setDNSCheck } from '@app/store/modules/cache';
import { lookup as lookupDNS, resolve as resolveDNS } from 'dns';
import { isPrivate as isPrivateIP } from 'ip';
import { promisify } from 'util';

const msHostname = new URL(MOTHERSHIP_GRAPHQL_LINK).host;

/**
 * Check if the local and network resolvers are able to see mothership
 *
 * See: https://nodejs.org/docs/latest/api/dns.html#dns_implementation_considerations
 */
export const checkDNS = async (hostname = msHostname): Promise<{ cloudIp: string }> => {
	const dnsCachedResuslt = getDnsCache();
	if (dnsCachedResuslt) {
		if (dnsCachedResuslt.cloudIp) {
			return { cloudIp: dnsCachedResuslt.cloudIp };
		}

		if (dnsCachedResuslt.error) {
			throw dnsCachedResuslt.error;
		}
	}

	let local: string | null = null;
	let network: string | null = null;
	try {
		// Check the local resolver like "ping" does
		// Check the DNS server the server has set - does a DNS query on the network
		const [localRes, networkRes] = await Promise.all([
			promisify(lookupDNS)(hostname).then(({ address }) => address),
			promisify(resolveDNS)(hostname).then(([address]) => address),
		]);
		local = localRes;
		network = networkRes;
		// The user's server and the DNS server they're using are returning different results
		if (!local.includes(network)) throw new Error(`Local and network resolvers showing different IP for "${hostname}". [local="${local ?? 'NOT FOUND'}"] [network="${network ?? 'NOT FOUND'}"]`);

		// The user likely has a PI-hole or something similar running.
		if (isPrivateIP(local)) throw new Error(`"${hostname}" is being resolved to a private IP. [IP=${local ?? 'NOT FOUND'}]`);
	} catch (error: unknown) {
		if (!(error instanceof Error)) {
			throw error;
		}

		store.dispatch(setDNSCheck({ cloudIp: null, error }));
	}

	if (typeof local === 'string' || typeof network === 'string') {
		const validIp: string = local ?? network!;
		store.dispatch(setDNSCheck({ cloudIp: validIp, error: null }));

		return { cloudIp: validIp };
	}

	return { cloudIp: '' };
};
