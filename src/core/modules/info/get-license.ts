/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { varState } from '@app/core/states/var';
import type { CoreContext, CoreResult } from '@app/core/types';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { getKeyFile } from '@app/core/utils/misc/get-key-file';

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

	// Get license data
	const type = varState.data.regTy.toUpperCase();
	const state = varState.data.regState;
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
