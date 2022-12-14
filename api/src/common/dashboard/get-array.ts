import { addTogether } from '@app/core/utils/misc/add-together';
import { getters } from '@app/store';
import { type DashboardArrayInput } from '../../graphql/generated/client/graphql';

export const getArray = (): DashboardArrayInput => {
	const emhttp = getters.emhttp();

	const arrayState = emhttp.var.mdState.toLowerCase();
	const state: string = arrayState.startsWith('error') ? arrayState.split(':')[1] : arrayState;

	// All known disks
	const allDisks = emhttp.disks.filter(disk => disk.device);

	// Array disks
	const disks = allDisks.filter(disk => disk.name.startsWith('disk'));

	// Disk sizes
	const disksTotalBytes = addTogether(disks.map(_ => _.fsSize * 1_024));
	const disksFreeBytes = addTogether(disks.map(_ => _.fsFree * 1_024));

	// Max
	const maxDisks = emhttp.var.maxArraysz ?? disks.length;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const disksPayload = {
		free: `${maxDisks - disks.length}`,
		used: `${disks.length}`,
		total: `${maxDisks}`,
	};
	return {
		state,
		capacity: {
			bytes: {
				free: `${disksFreeBytes}`,
				used: `${disksTotalBytes - disksFreeBytes}`,
				total: `${disksTotalBytes}`,
			},
		},
	};
};
