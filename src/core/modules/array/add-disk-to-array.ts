/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { CoreContext, CoreResult } from '@app/core/types';
import { FieldMissingError } from '@app/core/errors/field-missing-error';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { hasFields } from '@app/core/utils/validation/has-fields';
import { arrayIsRunning } from '@app/core/utils/array/array-is-running';
import { emcmd } from '@app/core/utils/clients/emcmd';
import { ArrayRunningError } from '@app/core/errors/array-running-error';
import { getArray } from '@app/core/modules/get-array';

/**
 * Add a disk to the array.
 */
export const addDiskToArray = async function (context: CoreContext): Promise<CoreResult> {
	const { data = {}, user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'array',
		action: 'create',
		possession: 'any',
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
		[`slotId.${slot}`]: diskId,
	});

	const array = getArray(context);

	// Disk added successfully
	return {
		text: `Disk was added to the array in slot ${slot}.`,
		json: array.json,
	};
};
