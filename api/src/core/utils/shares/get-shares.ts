/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { processShare } from '@app/core/utils/shares/process-share';
import { AppError } from '@app/core/errors/app-error';
import { getters } from '@app/store';
import { DiskShare, UserShare } from '@app/core/types/states/share';

interface Filter {
	name: string;
}

type Overload = {
	(type: 'disk', filter?: Filter): DiskShare | null;
	(type: 'disks', filter?: Filter): DiskShare[];
	(type: 'user', filter?: Filter): UserShare | null;
	(type: 'users', filter?: Filter): UserShare[];
	(): { disks: DiskShare[]; users: UserShare[] };
};

/**
 * Get all share types.
 */
export const getShares: Overload = (type?: string, filter?: Filter) => {
	const emhttp = getters.emhttp();
	const types = {
		user(name: string) {
			// If a name was provided find a matching share otherwise return the first share
			const share = name ? emhttp.shares.find(share => share.name === name) : emhttp.shares[0];
			if (!share) return null;
			return processShare('user', share);
		},
		users: () => emhttp.shares.map(share => processShare('user', share)),
		disk(name: string) {
			const diskShares = emhttp.slots.filter(slot => slot.exportable && slot.name.startsWith('disk'));

			// If a name was provided find a matching share otherwise return the first share
			const share = name ? diskShares.find(slot => slot.name === name) : diskShares[0];
			if (!share) return null;
			return processShare('disk', share);
		},
		disks: () => emhttp.slots.filter(slot => slot.exportable && slot.name.startsWith('disk')).map(disk => processShare('disk', disk)),
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
		disks: types.disks(),
	};
};
