/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { varState } from '@app/core/states/var';
import type { CoreContext, CoreResult } from '@app/core/types';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';

/**
 * Get server's flash info
 *
 * @memberof Core
 * @module info/get-flash
 */
export const getFlash = async function (context: CoreContext): Promise<CoreResult> {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'flash',
		action: 'read',
		possession: 'any',
	});

	// Get flash data
	const guid = varState.data.flashGuid;
	const product = varState.data.flashProduct;
	const vendor = varState.data.flashVendor;

	return {
		get text() {
			return `GUID: ${guid}\nProduct: ${product}\nVendor: ${vendor}`;
		},
		get json() {
			return {
				guid,
				product,
				vendor,
			};
		},
	};
};
