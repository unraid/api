/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import type { CoreContext, CoreResult } from '@app/core/types';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { getters } from '@app/store';

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

	const emhttp = getters.emhttp();

	// Get flash data
	const guid = emhttp.var.flashGuid;
	const product = emhttp.var.flashProduct;
	const vendor = emhttp.var.flashVendor;

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
