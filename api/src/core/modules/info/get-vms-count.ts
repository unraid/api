/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { ConnectListAllDomainsFlags } from '@vmngr/libvirt';
import type { CoreResult, CoreContext } from '@app/core/types';
import { ensurePermission, getHypervisor } from '@app/core/utils';

/**
 * Two arrays containing the installed and started VMs.
 *
 * @param installed The amount of installed VMs.
 * @param started The amount of running VMs.
 * @interface Result
 * @extends {CoreResult}
 */
interface Result extends CoreResult {
	json: {
		installed: number;
		started: number;
	};
}

/**
 * Get count of VMs.
 */
export const getVmsCount = async function (context: CoreContext): Promise<Result> {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'vms',
		action: 'read',
		possession: 'any',
	});

	try {
		const hypervisor = await getHypervisor();
		if (!hypervisor) {
			throw new Error('No hypervisor connection!');
		}

		const activeDomains = await hypervisor.connectListAllDomains(ConnectListAllDomainsFlags.ACTIVE) as unknown[];
		const inactiveDomains = await hypervisor.connectListAllDomains(ConnectListAllDomainsFlags.INACTIVE) as unknown[];
		const installed = activeDomains.length + inactiveDomains.length;
		const started = activeDomains.length;

		return {
			text: `Installed: ${installed} \nStarted: ${started}`,
			json: {
				installed,
				started,
			},
		};
	} catch {
		const installed = 0;
		const started = 0;
		return {
			text: `Installed: ${installed} \nStarted: ${started}`,
			json: {
				installed,
				started,
			},
		};
	}
};
