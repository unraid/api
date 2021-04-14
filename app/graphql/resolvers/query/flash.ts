/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { varState } from '../../../core/states';
import { ensurePermission } from '../../../core/utils';
import { Context } from '../../schema/utils';

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
