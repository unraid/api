import { type CoreContext, type CoreResult } from '@app/core/types';
import { AppError } from '@app/core/errors/app-error';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';

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
		possession: 'any',
	});

	const { id } = params;
	const disk = await Disks.findOne({ id });

	if (!disk) {
		throw new AppError(`No disk found matching ${id}`, 404);
	}

	return {
		text: `Disk: ${JSON.stringify(disk, null, 2)}`,
		json: disk,
	};
};
