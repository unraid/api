/*!
 * Copyright 2019-2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { varState } from '../../states';
import { CoreContext, CoreResult } from '../../types';
import { ensurePermission } from '../../utils';

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
		possession: 'any'
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
				vendor
			};
		}
	};
};
