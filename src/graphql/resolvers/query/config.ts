/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { varState } from '@app/core/states';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { Context } from '@app/graphql/schema/utils';

export default async (_: unknown, __: unknown, context: Context) => {
	ensurePermission(context.user, {
		resource: 'config',
		action: 'read',
		possession: 'any'
	});

	return {
		valid: varState.data.configValid,
		error: varState.data.configValid ? null : ({
			error: 'UNKNOWN_ERROR',
			invalid: 'INVALID',
			nokeyserver: 'NO_KEY_SERVER',
			withdrawn: 'WITHDRAWN'
		}[varState.data.configState] ?? 'UNKNOWN_ERROR')
	};
};
