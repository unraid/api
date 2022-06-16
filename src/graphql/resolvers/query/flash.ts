/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { varState } from '@app/core/states';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { Context } from '@app/graphql/schema/utils';

export default async (_: unknown, __: unknown, context: Context) => {
	ensurePermission(context.user, {
		resource: 'flash',
		action: 'read',
		possession: 'any'
	});

	return {
		guid: varState.data.flashGuid,
		vendor: varState.data.flashVendor,
		product: varState.data.flashProduct
	};
};
