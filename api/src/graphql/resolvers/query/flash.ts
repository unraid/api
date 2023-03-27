/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { type Context } from '@app/graphql/schema/utils';
import { getters } from '@app/store';

export default async (_: unknown, __: unknown, context: Context) => {
	ensurePermission(context.user, {
		resource: 'flash',
		action: 'read',
		possession: 'any',
	});

	const emhttp = getters.emhttp();

	return {
		guid: emhttp.var.flashGuid,
		vendor: emhttp.var.flashVendor,
		product: emhttp.var.flashProduct,
	};
};
