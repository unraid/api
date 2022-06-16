/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { varState } from '@app/core/states';
import { getKeyFile } from '@app/core/utils/misc/get-key-file';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { Context } from '@app/graphql/schema/utils';

export default async (_: unknown, __: unknown, context: Context) => {
	ensurePermission(context.user, {
		resource: 'registration',
		action: 'read',
		possession: 'any'
	});

	const isTrial = varState.data.regTy.toLowerCase() === 'trial';
	const isExpired = varState.data.regTy.includes('expired');

	return {
		guid: varState.data.regGuid,
		type: varState.data.regTy,
		state: varState.data.regState,
		// Based on https://github.com/unraid/dynamix.unraid.net/blob/c565217fa8b2acf23943dc5c22a12d526cdf70a1/source/dynamix.unraid.net/usr/local/emhttp/plugins/dynamix.my.servers/include/state.php#L64
		expiration: 1_000 * ((isTrial || isExpired) ? Number(varState.data.regTm2) : 0),
		keyFile: {
			location: varState.data.regFile,
			contents: await getKeyFile()
		}
	};
};
