/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import type { CoreResult, CoreContext } from '@app/core/types';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { getShares } from '@app/core/utils/shares/get-shares';

/**
 * Get all shares.
 */
export const getAllShares = async (context: CoreContext): Promise<CoreResult> => {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'share',
		action: 'read',
		possession: 'any'
	});

	const userShares = getShares('users');
	const diskShares = getShares('disks');

	const shares = [
		...userShares,
		...diskShares
	];

	return {
		text: `Shares: ${JSON.stringify(shares, null, 2)}`,
		json: shares
	};
};
