/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { CoreContext, CoreResult, UserShare, DiskShare } from '../../../types';
import { AppError } from '../../../errors';
import { getShares, ensurePermission } from '../../../utils';

interface Context extends CoreContext {
	params: {
		/** Name of the share */
		name: string;
	};
}

interface Result extends CoreResult {
	json: UserShare | DiskShare;
}

/**
 * Get single share.
 */
export const getShare = async function(context: Context): Promise<Result> {
	const { params, user } = context;
	const { name } = params;

	// Check permissions
	ensurePermission(user, {
		resource: 'share',
		action: 'read',
		possession: 'any'
	});

	const userShare = getShares('user', { name });
	const diskShare = getShares('disk', { name });

	const share = [
		userShare,
		diskShare
	].filter(_ => _)[0];

	if (!share) {
		throw new AppError('No share found with that name.', 404);
	}

	return {
		text: `Share: ${JSON.stringify(share, null, 2)}`,
		json: share
	};
};
