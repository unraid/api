/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { CoreResult, CoreContext } from '../types';
import { getShares, ensurePermission } from '../utils';

/**
 * Get all shares.
 */
export const getAllShares = async(context: CoreContext): Promise<CoreResult> => {
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
