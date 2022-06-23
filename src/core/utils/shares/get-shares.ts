/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import type { UserShare, DiskShare } from '@app/core/types/states';
import { sharesState } from '@app/core/states/shares';
import { slotsState } from '@app/core/states/slots';
import { processShare } from '@app/core/utils/shares/process-share';
import { AppError } from '@app/core/errors/app-error';

interface Filter {
	name: string;
}

type Overload = {
	(type: 'disk', filter?: Filter): DiskShare;
	(type: 'disks', filter?: Filter): DiskShare[];
	(type: 'user', filter?: Filter): UserShare;
	(type: 'users', filter?: Filter): UserShare[];
	(): { disks: DiskShare[]; users: UserShare[] };
};

/**
 * Get all share types.
 */
export const getShares: Overload = (type?: string, filter?: Filter) => {
	const types = {
		user: (name?: string) => processShare('user', sharesState.findOne(name ? { name } : {})),
		users: () => sharesState.find().map(share => processShare('user', share)),
		disk: (name?: string) => processShare('disk', slotsState.findOne({ exportable: 'yes', ...(name ? { name } : {}) })),
		disks: () => slotsState.find({ exportable: 'yes' }).filter(({ name }) => name.startsWith('disk')).map(disk => processShare('disk', disk))
	};

	// Return a type of share
	if (type) {
		if (!Object.keys(types).includes(type)) {
			throw new AppError(`Unknown type "${type}", valid types are ${Object.keys(types).join(', ')}.`);
		}

		return types[type](filter?.name);
	}

	// Return all shares
	return {
		users: types.users(),
		disks: types.disks()
	};
};
