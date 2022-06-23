/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import type { CoreContext, CoreResult } from '@app/core/types';
import { AppError } from '@app/core/errors/app-error';
import { NotImplementedError } from '@app/core/errors/not-implemented-error';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { sharesState } from '@app/core/states/shares';
import { slotsState } from '@app/core/states/slots';

export const addShare = async (context: CoreContext): Promise<CoreResult> => {
	const { user, data } = context;

	if (!data?.name) {
		throw new AppError('No name provided');
	}

	// Check permissions
	ensurePermission(user, {
		resource: 'share',
		action: 'create',
		possession: 'any'
	});

	const name: string = data.name;
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
