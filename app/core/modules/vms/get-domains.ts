/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { CoreResult, CoreContext } from '../../types';
import { parseDomains, getHypervisor, ensurePermission } from '../../utils';

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
	const defined = await parseDomains('name', await hypervisor.listDefinedDomainsAsync());
	const active = await parseDomains('id', await hypervisor.listActiveDomainsAsync());

	return {
		text: `Defined domains: ${JSON.stringify(defined, null, 2)}\nActive domains: ${JSON.stringify(active, null, 2)}`,
		json: [
			...defined,
			...active
		]
	};
};
