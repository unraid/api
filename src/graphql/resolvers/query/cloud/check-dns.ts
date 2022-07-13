/*!
 * Copyright 2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { lookup as lookupDNS, resolve as resolveDNS } from 'dns';
import { isPrivate as isPrivateIP } from 'ip';
import { promisify } from 'util';

const hostname = 'mothership.unraid.net';

/**
 * Check if the local and network resolvers are able to see mothership
 *
 * See: https://nodejs.org/docs/latest/api/dns.html#dns_implementation_considerations
 */
export const checkDNS = async () => {
	// Check the local resolver like "ping" does
	const local = await promisify(lookupDNS)(hostname).then(({ address }) => address);

	// Check the DNS server the server has set
	// This does a DNS query on the network
	const network = await promisify(resolveDNS)(hostname).then(([address]) => address);

	// The user's server and the DNS server they're using are returning different results
	if (local !== network) throw new Error(`Local and network resolvers showing different IP for "${hostname}". [local="${local}"] [network="${network}"]`);

	// The user likely has a PI-hole or something similar running.
	if (isPrivateIP(local)) throw new Error(`"${hostname}" is being resolved to a private IP. [IP=${local}]`);

	return { cloudIp: local };
};
