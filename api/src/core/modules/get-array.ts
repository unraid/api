/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import type { CoreResult, CoreContext } from '@app/core/types';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { addTogether } from '@app/core/utils/misc/add-together';
import { getters } from '@app/store';

/**
 * Get array info.
 * @returns Array state and array/disk capacity.
 */
export const getArray = (context: CoreContext): CoreResult => {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'array',
		action: 'read',
		possession: 'any',
	});

	const emhttp = getters.emhttp();

	// Array state
	const arrayState = emhttp.var.mdState.toLowerCase();
	const state: string = arrayState.startsWith('error') ? arrayState.split(':')[1] : arrayState;

	// All known disks
	const allDisks = emhttp.disks.filter(disk => disk.device);

	// Array boot/parities/disks/caches
	const boot = allDisks.find(disk => disk.name === 'flash');
	const parities = allDisks.filter(disk => disk.name.startsWith('parity'));
	const disks = allDisks.filter(disk => disk.name.startsWith('disk'));
	const caches = allDisks.filter(disk => disk.name.startsWith('cache'));

	// Disk sizes
	const disksTotalBytes = addTogether(disks.map(_ => _.fsSize * 1_024));
	const disksFreeBytes = addTogether(disks.map(_ => _.fsFree * 1_024));

	// Max
	const maxDisks = emhttp.var.maxArraysz ?? disks.length;

	// Array capacity
	const capacity = {
		bytes: {
			free: `${disksFreeBytes}`,
			used: `${disksTotalBytes - disksFreeBytes}`,
			total: `${disksTotalBytes}`,
		},
		disks: {
			free: `${maxDisks - disks.length}`,
			used: `${disks.length}`,
			total: `${maxDisks}`,
		},
	};

	const text = `State: ${state}\nCapacity: ${JSON.stringify(capacity, null, 2)}\n${JSON.stringify(disks, null, 2)}`;

	return {
		text,
		json: {
			state,
			capacity,
			boot,
			parities,
			disks,
			caches,
		},
	};
};
