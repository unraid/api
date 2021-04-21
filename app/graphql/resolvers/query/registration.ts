/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import btoa from 'btoa';
import { promises } from 'fs';
import { varState } from '../../../core/states';
import { ensurePermission } from '../../../core/utils';
import { Context } from '../../schema/utils';

export default async (_: unknown, __: unknown, context: Context) => {
	ensurePermission(context.user, {
		resource: 'registration',
		action: 'read',
		possession: 'any'
	});

	// Get key file
	const file = await promises.readFile(varState.data.regFile, 'binary');
	const parsedFile = btoa(file).trim().replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

	return {
		guid: varState.data.regGuid,
		type: varState.data.regTy,
		keyFile: {
			location: varState.data.regFile,
			contents: parsedFile
		}
	};
};
