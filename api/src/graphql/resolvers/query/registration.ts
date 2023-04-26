/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { getKeyFile } from '@app/core/utils/misc/get-key-file';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { type Registration, type QueryResolvers } from '@app/graphql/generated/api/types';
import { getters } from '@app/store';
import { FileLoadStatus } from '@app/store/types';

export const registration: QueryResolvers['registration'] = async (_, __, context) => {
	ensurePermission(context.user, {
		resource: 'registration',
		action: 'read',
		possession: 'any',
	});

	const emhttp = getters.emhttp();
	if (emhttp.status !== FileLoadStatus.LOADED || !emhttp.var?.regTy) {
		return null;
	} 

	const isTrial = emhttp.var.regTy?.toLowerCase() === 'trial';
	const isExpired = emhttp.var.regTy.includes('expired');

	const registration: Registration = {
        guid: emhttp.var.regGuid,
        type: emhttp.var.regTy,
        state: emhttp.var.regState,
        // Based on https://github.com/unraid/dynamix.unraid.net/blob/c565217fa8b2acf23943dc5c22a12d526cdf70a1/source/dynamix.unraid.net/usr/local/emhttp/plugins/dynamix.my.servers/include/state.php#L64
        expiration:
			(1_000 * (isTrial || isExpired ? Number(emhttp.var.regTm2) : 0)).toString(),
        keyFile: {
            location: emhttp.var.regFile,
            contents: await getKeyFile(),
        },
    };
	return registration;
};
