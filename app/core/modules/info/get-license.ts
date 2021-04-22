/*!
 * Copyright 2019-2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { varState } from '../../states';
import { CoreContext, CoreResult } from '../../types';
import { ensurePermission } from '../../utils';
import { getKeyFile } from '../../utils/misc/get-key-file';

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
		possession: 'any'
	});

	// Get license data
	const type = varState.data.regTy;
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
				file
			};
		}
	};
};
