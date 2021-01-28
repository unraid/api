/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { CoreContext, CoreResult } from '../../../types';
import { AppError } from '../../../errors';
import { ensurePermission } from '../../../utils';

interface Context extends CoreContext {
	params: {
		id: string;
	};
}

/**
 * Get a single disk.
 */
export const getDisk = async (context: Context, Disks): Promise<CoreResult> => {
	const { params, user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'disk',
		action: 'read',
		possession: 'any'
	});

	const { id } = params;
	const disk = await Disks.findOne({ id });

	if (!disk) {
		throw new AppError(`No disk found matching ${id}`, 404);
	}

	return {
		text: `Disk: ${JSON.stringify(disk, null, 2)}`,
		json: disk
	};
};
