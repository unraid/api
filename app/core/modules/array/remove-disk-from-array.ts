/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { CoreContext, CoreResult } from '../../types';
import { ArrayRunningError, FieldMissingError } from '../../errors';
import { getArray } from '../get-array';
import { ensurePermission } from '../../utils/permissions/ensure-permission';
import { hasFields } from '../../utils/validation/has-fields';
import { arrayIsRunning } from '../../utils/array/array-is-running';

interface Context extends CoreContext {
	data: {
		/** The slot the disk is in. */
		slot: string;
	};
}

/**
 * Remove a disk from the array.
 * @returns The updated array.
 */
export const removeDiskFromArray = async (context: Context): Promise<CoreResult> => {
	const { data, user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'array',
		action: 'create',
		possession: 'any'
	});

	const missingFields = hasFields(data, ['id']);

	if (missingFields.length !== 0) {
		// Only log first error
		throw new FieldMissingError(missingFields[0]);
	}

	if (arrayIsRunning()) {
		throw new ArrayRunningError();
	}

	const { slot } = data;

	// Error removing disk
	// if () {
	// }

	const array = getArray(context);

	// Disk removed successfully
	return {
		text: `Disk was removed from the array in slot ${slot}.`,
		json: array.json
	};
};
