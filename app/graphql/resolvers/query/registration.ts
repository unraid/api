/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { varState } from '../../../core/states';
import { ensurePermission, getKeyFile } from '../../../core/utils';
import { Context } from '../../schema/utils';

export default async (_: unknown, __: unknown, context: Context) => {
	ensurePermission(context.user, {
		resource: 'registration',
		action: 'read',
		possession: 'any'
	});

	return {
		guid: varState.data.regGuid,
		type: varState.data.regTy,
		state: varState.data.regState,
		keyFile: {
			location: varState.data.regFile,
			contents: await getKeyFile()
		}
	};
};
