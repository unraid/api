import { ac } from '@app/core/permissions';
import { getPermissions as getUserPermissions } from '@app/core/utils/permissions/get-permissions';
import type { CoreContext, CoreResult } from '@app/core/types';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';

/**
 * Get all permissions.
 */
export const getPermissions = async function (context: CoreContext): Promise<CoreResult> {
	const { user } = context;

	// Bail if the user doesn't have permission
	ensurePermission(user, {
		resource: 'permission',
		action: 'read',
		possession: 'any',
	});

	// Get all scopes
	const scopes = Object.assign({}, ...Object.values(ac.getGrants()).map(grant => {
		// @ts-expect-error - $extend and grants are any
		const { $extend, ...grants } = grant;
		return {
			...grants,
			...$extend && getUserPermissions($extend),
		};
	}));

	// Get all roles and their scopes
	const grants = Object.entries(ac.getGrants())
		.map(([name, grant]) => {
			// @ts-expect-error - $extend and grants are any
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { $extend: _, ...grants } = grant;
			return [name, grants];
		})
		.reduce((object, {
			0: key,
			1: value,
		}) => Object.assign(object, {
			[key.toString()]: value,
		}), {});

	return {
		text: `Scopes: ${JSON.stringify(scopes, null, 2)}`,
		json: {
			scopes,
			grants,
		},
	};
};
