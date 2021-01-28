/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { CoreContext, CoreResult } from '../types';
import { AppError, NotImplementedError } from '../errors';
import { sharesState, slotsState } from '../states';
import { ensurePermission } from '../utils';

export const addShare = async (context: CoreContext): Promise<CoreResult> => {
	const { user, data = {} } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'share',
		action: 'create',
		possession: 'any'
	});

	const { name } = data;
	const userShares = sharesState.find().map(({ name }) => name);
	const diskShares = slotsState.find({ exportable: 'yes' }).filter(({ name }) => name.startsWith('disk')).map(({ name }) => name);

	// Existing share names
	const inUseNames = new Set([
		...userShares,
		...diskShares
	]);

	if (inUseNames.has(name)) {
		throw new AppError(`Share already exists with name: ${name}`, 400);
	}

	throw new NotImplementedError();
};
