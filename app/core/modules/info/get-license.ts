/*!
 * Copyright 2019-2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import fs from 'fs';
import { varState } from '../../states';
import { CoreContext, CoreResult } from '../../types';
import { ensurePermission } from '../../utils';

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
	const state = (varState.data.regCheck.trim() === '' ? type : varState.data.regCheck).toUpperCase();
	const file = await fs.promises.readFile(varState.data.regFile, 'utf8');
	const parsedFile = Buffer.from(file).toString('base64').trim().replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

	return {
		get text() {
			return `License type: ${type}\nState: ${state}`;
		},
		get json() {
			return {
				type,
				state,
				file: parsedFile
			};
		}
	};
};

