/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import pProps from 'p-props';
import { type Domain } from '@app/core/types';
import { getHypervisor } from '@app/core/utils/vms/get-hypervisor';

export type DomainLookupType = 'id' | 'uuid' | 'name';

/**
 * Parse domain
 *
 * @param type What lookup type to use.
 * @param id The domain's ID, UUID or name.
 * @private
 */
export const parseDomain = async (type: DomainLookupType, id: string): Promise<Domain> => {
	const types = {
		id: 'lookupDomainByIdAsync',
		uuid: 'lookupDomainByUUIDAsync',
		name: 'lookupDomainByNameAsync',
	};

	if (!type || !Object.keys(types).includes(type)) {
		throw new Error(`Type must be one of [${Object.keys(types).join(', ')}], ${type} given.`);
	}

	const client = await getHypervisor();
	const method = types[type];
	const domain = await client[method](id);
	const info = await domain.getInfoAsync();

	const results = await pProps({
		uuid: domain.getUUIDAsync(),
		osType: domain.getOSTypeAsync(),
		autostart: domain.getAutostartAsync(),
		maxMemory: domain.getMaxMemoryAsync(),
		schedulerType: domain.getSchedulerTypeAsync(),
		schedulerParameters: domain.getSchedulerParametersAsync(),
		securityLabel: domain.getSecurityLabelAsync(),
		name: domain.getNameAsync(),
		...info,
		state: info.state.replace(' ', '_'),
	});

	if (info.state === 'running') {
		results.vcpus = await domain.getVcpusAsync();
		results.memoryStats = await domain.getMemoryStatsAsync();
	}

	// @ts-expect-error fix pProps inferred type
	return results;
};
