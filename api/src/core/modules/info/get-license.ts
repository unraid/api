/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import type { CoreContext, CoreResult } from '@app/core/types';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { getKeyFile } from '@app/core/utils/misc/get-key-file';
import { getters } from '@app/store';

/**
 * Get server's license info
 *
 * @memberof Core
 * @module info/get-license
 */
export const getLicense = async function (context: CoreContext): Promise<CoreResult> {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'license',
		action: 'read',
		possession: 'any',
	});

	const emhttp = getters.emhttp();

	// Get license data
	const type = emhttp.var.regTy.toUpperCase();
	const state = emhttp.var.regState;
	const file = await getKeyFile();

	return {
		get text() {
			return `License type: ${type}\nState: ${state}`;
		},
		get json() {
			return {
				type,
				state,
				file,
			};
		},
	};
};
