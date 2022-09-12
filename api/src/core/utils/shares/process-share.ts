/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { nfsSecState } from '@app/core/states/nfs-sec';
import { smbSecState } from '@app/core/states/smb-sec';
import { slotsState } from '@app/core/states/slots';
import type { Slot } from '@app/core/types/states/slot';
import type { DiskShare, Share, UserShare } from '../../types/states/share';

const processors = {
	user(share: Share) {
		const { cache: _, name, ...rest } = share;

		// Get each config for the share
		const { name: __, ...smb } = (smbSecState.findOne({ name }) || { name });
		const { name: ___, ...nfs } = (nfsSecState.findOne({ name }) || { name });

		return {
			type: 'user',
			smb,
			nfs,
			...rest,
		};
	},
	disk(share: Slot) {
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
