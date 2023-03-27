/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { type Context } from '@app/graphql/schema/utils';
import { getters } from '@app/store';

export default async (_: unknown, __: unknown, context: Context) => {
	ensurePermission(context.user, {
		resource: 'config',
		action: 'read',
		possession: 'any',
	});

	const emhttp = getters.emhttp();

	return {
		valid: emhttp.var.configValid,
		error: emhttp.var.configValid ? null : ({
			error: 'UNKNOWN_ERROR',
			invalid: 'INVALID',
			nokeyserver: 'NO_KEY_SERVER',
			withdrawn: 'WITHDRAWN',
		}[emhttp.var.configState] ?? 'UNKNOWN_ERROR'),
	};
};
