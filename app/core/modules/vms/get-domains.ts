/*!
 * Copyright 2019-2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { ConnectListAllDomainsFlags } from '@vmngr/libvirt';
import { log } from '../../log';
import { CoreResult, CoreContext } from '../../types';
import { getHypervisor, ensurePermission } from '../../utils';

/**
 * Get vm domains.
 */
export const getDomains = async (context: CoreContext): Promise<CoreResult> => {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'domain',
		action: 'read',
		possession: 'any'
	});

	const hypervisor = await getHypervisor();
	const activeDomains = await hypervisor.connectListAllDomains(ConnectListAllDomainsFlags.ACTIVE);
	const inactiveDomains = await hypervisor.connectListAllDomains(ConnectListAllDomainsFlags.INACTIVE);
	const activeDomainNames = await Promise.all(activeDomains.map(async domain => hypervisor.domainGetName(domain)));
	const inactiveDomainNames = await Promise.all(inactiveDomains.map(async domain => hypervisor.domainGetName(domain)));

	log.debug('Active: "%s"', activeDomains);
	log.debug('Inactive: "%s"', inactiveDomains);

	return {
		text: `Defined domains: ${JSON.stringify(activeDomainNames, null, 2)}\nActive domains: ${JSON.stringify(inactiveDomainNames, null, 2)}`,
		json: [
			...activeDomains,
			...inactiveDomains
		]
	};
};
