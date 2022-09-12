/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { cpu, cpuFlags } from 'systeminformation';
import type { CoreResult, CoreContext } from '@app/core/types';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';

/**
 * Get CPU info.
 */
export const getCpu = async function (context: CoreContext): Promise<CoreResult> {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'cpu',
		action: 'read',
		possession: 'any',
	});

	const { cores, physicalCores, ...rest } = await cpu();
	const flags = await cpuFlags().then(flags => flags.split(' '));

	const result = {
		...rest,
		cores: physicalCores,
		threads: cores,
		flags,
	};

	return {
		text: `CPU info: ${JSON.stringify(result, null, 2)}`,
		json: result,
	};
};
