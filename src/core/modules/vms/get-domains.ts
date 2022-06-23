/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { ConnectListAllDomainsFlags } from '@vmngr/libvirt';
import type { CoreResult, CoreContext } from '@app/core/types';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { getHypervisor } from '@app/core/utils/vms/get-hypervisor';

const states = {
	0: 'NOSTATE',
	1: 'RUNNING',
	2: 'IDLE',
	3: 'PAUSED',
	4: 'SHUTDOWN',
	5: 'SHUTOFF',
	6: 'CRASHED',
	7: 'PMSUSPENDED'
};

/**
 * Get vm domains.
 */
export const getDomains = async (context: CoreContext): Promise<CoreResult> => {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'vms/domain',
		action: 'read',
		possession: 'any'
	});

	try {
		const hypervisor = await getHypervisor();
		const activeDomains = await hypervisor.connectListAllDomains(ConnectListAllDomainsFlags.ACTIVE);
		const inactiveDomains = await hypervisor.connectListAllDomains(ConnectListAllDomainsFlags.INACTIVE);
		const autoStartDomains = await hypervisor.connectListAllDomains(ConnectListAllDomainsFlags.AUTOSTART);
		const activeDomainNames = await Promise.all(activeDomains.map(async domain => hypervisor.domainGetName(domain)));
		const inactiveDomainNames = await Promise.all(inactiveDomains.map(async domain => hypervisor.domainGetName(domain)));
		const autoStartDomainNames = await Promise.all(autoStartDomains.map(async domain => hypervisor.domainGetName(domain)));

		// Get all domains
		const domains = await hypervisor.connectListAllDomains();
		const resolvedDomains = await Promise.all(domains.map(async domain => {
			const info = await hypervisor.domainGetInfo(domain);
			const name = await hypervisor.domainGetName(domain);
			const features = {};
			return {
				name,
				uuid: await hypervisor.domainGetUUIDString(domain),
				state: states[info.state],
				autoStart: autoStartDomainNames.includes(name),
				features
			};
		}));

		return {
			text: `Defined domains: ${JSON.stringify(activeDomainNames, null, 2)}\nActive domains: ${JSON.stringify(inactiveDomainNames, null, 2)}`,
			json: resolvedDomains
		};
	} catch (error: unknown) {
		// If we hit an error expect libvirt to be offline
		return {
			text: `Defined domains: ${JSON.stringify([], null, 2)}\nActive domains: ${JSON.stringify([], null, 2)}`,
			json: null
		};
	}
};
