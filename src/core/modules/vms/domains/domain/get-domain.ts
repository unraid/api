/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { CoreContext, CoreResult } from '../../../../types';
import { AppError } from '../../../../errors';
import { parseDomain, getHypervisor, ensurePermission } from '../../../../utils';

interface Context extends CoreContext {
	params: {
		/** Domain name. */
		name: string;
	};
}

/**
 * Get a single vm domain.
 */
export const getDomain = async function (context: Context): Promise<CoreResult> {
	const { params, user } = context;
	const { name } = params;

	// Check permissions
	ensurePermission(user, {
		resource: 'domain',
		action: 'read',
		possession: 'any'
	});

	const hypervisor = await getHypervisor();

	// If domain doesn't exist return not found
	await hypervisor.lookupDomainByNameAsync(name).catch(() => {
		throw new AppError(`No domain found with name: ${name}`);
	});

	// Get domain info
	const domain = await parseDomain('name', name);

	return {
		text: `${domain.name}: ${JSON.stringify(domain, null, 2)}`,
		json: domain
	};
};
