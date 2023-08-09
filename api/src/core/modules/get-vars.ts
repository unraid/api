import type { CoreContext, CoreResult } from '@app/core/types';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { getters } from '@app/store';

/**
 * Get all system vars.
 */
export const getVars = async (context: CoreContext): Promise<CoreResult> => {
	const { user } = context;

	// Bail if the user doesn't have permission
	ensurePermission(user, {
		resource: 'vars',
		action: 'read',
		possession: 'any',
	});

	const emhttp = getters.emhttp();

	return {
		text: `Vars: ${JSON.stringify(emhttp.var, null, 2)}`,
		json: {
			...emhttp.var,
		},
	};
};
