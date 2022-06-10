/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { Share, Slot, DiskShare, UserShare } from '../../types/states';
import { slotsState, smbSecState, nfsSecState } from '../../states';

const processors = {
	user: (share: Share) => {
		const { cache, name, ...rest } = share;

		// Get each config for the share
		const { name: _, ...smb } = (smbSecState.findOne({ name }) || { name });
		const { name: __, ...nfs } = (nfsSecState.findOne({ name }) || { name });

		return {
			type: 'user',
			smb,
			nfs,
			...rest
		};
	},
	disk: (share: Slot) => {
		const { name } = share;
		const { name: _, ...smb } = smbSecState.findOne({ name });
		const { name: __, ...nfs } = (nfsSecState.findOne({ name }) || { name });
		const { fsSize, fsFree } = slotsState.findOne({ name });

		return {
			name,
			type: 'disk',
			size: Number(fsSize),
			free: Number(fsFree),
			smb,
			nfs
		};
	}
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
