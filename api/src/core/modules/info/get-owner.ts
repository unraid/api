/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { CoreContext, CoreResult } from '@app/core/types';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { getters } from '@app/store';

/**
 * Get server's owner info
 *
 * @memberof Core
 * @module info/get-owner
 */
export const getOwner = async function (context: CoreContext): Promise<CoreResult> {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'owner',
		action: 'read',
		possession: 'any',
	});

	return {
		get text() {
			return `Owner: ${getters.config().remote.username ?? 'root'}`;
		},
		get json() {
			return {
				username: getters.config().remote.username ?? 'root',
				url: '',
				avatar: getters.config().remote.avatar,
			};
		},
	};
};
