/* eslint-disable @typescript-eslint/no-unused-vars */
import { getters } from '@app/store';
import type { DiskShare, Share, UserShare } from '@app/core/types/states/share';
import { type ArrayDisk } from '@app/graphql/generated/api/types';

const processors = {
	user(share: Share) {
		const { cache: _, name, ...rest } = share;
		const { smbShares, nfsShares } = getters.emhttp();

		// Get each config for the share
		const { name: __, ...smb } = smbShares.find(share => share.name === name) ?? { name };
		const { name: ___, ...nfs } = nfsShares.find(share => share.name === name) ?? { name };

		return {
			name,
			type: 'user',
			smb,
			nfs,
			...rest,
		};
	},
	disk(share: ArrayDisk) {
		const { smbShares, nfsShares, disks } = getters.emhttp();
		const { name } = share;
		const { name: __, ...smb } = smbShares.find(share => share.name === name) ?? { name };
		const { name: ___, ...nfs } = nfsShares.find(share => share.name === name) ?? { name };
		const { fsSize, fsFree } = disks.find(slot => slot.name === name) ?? {};

		return {
			name,
			type: 'disk',
			size: Number(fsSize),
			free: Number(fsFree),
			smb,
			nfs,
		};
	},
};

type Overload = {
	(type: 'disk', share: ArrayDisk): DiskShare;
	(type: 'user', share: Share): UserShare;
};

/**
 * Process share.
 */
export const processShare: Overload = (type: string, share: Share | ArrayDisk) => {
	const processor = processors[type];
	return processor(share);
};
