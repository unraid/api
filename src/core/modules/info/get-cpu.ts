/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import si from 'systeminformation';
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

	const { cores, physicalCores, ...cpu } = await si.cpu();
	const flags = await si.cpuFlags().then(flags => flags.split(' '));

	const result = {
		...cpu,
		cores: physicalCores,
		threads: cores,
		flags,
	};

	return {
		text: `CPU info: ${JSON.stringify(result, null, 2)}`,
		json: result,
	};
};
