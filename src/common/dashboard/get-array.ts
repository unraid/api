import { slotsState } from '@app/core/states/slots';
import { varState } from '@app/core/states/var';
import { addTogether } from '@app/core/utils/misc/add-together';

export const getArray = () => {
	// Array state
	const arrayState = varState?.data?.mdState.toLowerCase();
	const state: string = arrayState.startsWith('error') ? arrayState.split(':')[1] : arrayState;

	// All known disks
	const allDisks = slotsState.find().filter(disk => disk.device);

	// Array disks
	const disks = allDisks.filter(disk => disk.name.startsWith('disk'));

	// Disk sizes
	const disksTotalBytes = addTogether(disks.map(_ => _.fsSize * 1024));
	const disksFreeBytes = addTogether(disks.map(_ => _.fsFree * 1024));

	// Max
	const maxDisks = varState?.data?.maxArraysz ?? disks.length;

	return {
		state,
		capacity: {
			bytes: {
				free: `${disksFreeBytes}`,
				used: `${disksTotalBytes - disksFreeBytes}`,
				total: `${disksTotalBytes}`
			},
			disks: {
				free: `${maxDisks - disks.length}`,
				used: `${disks.length}`,
				total: `${maxDisks}`
			}
		}
	};
};
