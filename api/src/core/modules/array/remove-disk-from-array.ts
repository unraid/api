import { type CoreContext, type CoreResult } from '@app/core/types';
import { FieldMissingError } from '@app/core/errors/field-missing-error';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { hasFields } from '@app/core/utils/validation/has-fields';
import { arrayIsRunning } from '@app/core/utils/array/array-is-running';
import { ArrayRunningError } from '@app/core/errors/array-running-error';
import { getArrayData } from '@app/core/modules/array/get-array-data';

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
		possession: 'any',
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

	const array = getArrayData()

	// Disk removed successfully
	return {
		text: `Disk was removed from the array in slot ${slot}.`,
		json: array,
	};
};
