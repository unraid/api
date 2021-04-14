/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

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

	const keyFile = varState.data.regFile ? await promises.readFile(varState.data.regFile, 'utf-8').then(file => {
		const fileAsBase64 = Buffer.from(file).toString('base64');
		return fileAsBase64.trim().replace(/\+/g, '-').replace(/\//g, '_').replace(/-/g, '');
	}) : '';

	return {
		guid: varState.data.regGuid,
		type: varState.data.regTy,
		keyFile: {
			location: varState.data.regFile,
			contents: keyFile
		}
	};
};
