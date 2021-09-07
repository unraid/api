/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { CoreContext, CoreResult } from '../../types';
import { FieldMissingError, ArrayRunningError } from '../../errors';
import { hasFields, arrayIsRunning, emcmd, ensurePermission } from '../../utils';
import { getArray } from '..';

/**
 * Add a disk to the array.
 */
export const addDiskToArray = async function (context: CoreContext): Promise<CoreResult> {
	const { data = {}, user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'array',
		action: 'create',
		possession: 'any'
	});

	const missingFields = hasFields(data, ['id']);
	if (missingFields.length !== 0) {
		// Just log first error
		throw new FieldMissingError(missingFields[0]);
	}

	if (arrayIsRunning()) {
		throw new ArrayRunningError();
	}

	const { id: diskId, slot: preferredSlot } = data;
	const slot = Number.parseInt(preferredSlot, 10);

	// Add disk
	await emcmd({
		changeDevice: 'apply',
		[`slotId.${slot}`]: diskId
	});

	const array = getArray(context);

	// Disk added successfully
	return {
		text: `Disk was added to the array in slot ${slot}.`,
		json: array.json
	};
};
