/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { ConnectListAllDomainsFlags } from '@vmngr/libvirt';
import { CoreResult, CoreContext } from '../../types';
import { ensurePermission, getHypervisor } from '../../utils';

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
		possession: 'any'
	});

	try {
		const hypervisor = await getHypervisor();
		const activeDomains = await hypervisor.connectListAllDomains(ConnectListAllDomainsFlags.ACTIVE) as [];
		const inactiveDomains = await hypervisor.connectListAllDomains(ConnectListAllDomainsFlags.INACTIVE) as [];
		const installed = activeDomains.length + inactiveDomains.length;
		const started = activeDomains.length;

		return {
			text: `Installed: ${installed} \nStarted: ${started}`,
			json: {
				installed,
				started
			}
		};
	} catch {
		const installed = 0;
		const started = 0;
		return {
			text: `Installed: ${installed} \nStarted: ${started}`,
			json: {
				installed,
				started
			}
		}
	}
};
