/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import type { Slot } from '@app/core/types/states/slots';
import { getters } from '@app/store';
import type { DiskShare, Share, UserShare } from '@app/core/types/states/share';

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
	disk(share: Slot) {
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
	(type: 'disk', share: Slot): DiskShare;
	(type: 'user', share: Share): UserShare;
};

/**
 * Process share.
 */
export const processShare: Overload = (type: string, share: Share | Slot) => {
	const processor = processors[type];
	return processor(share);
};
