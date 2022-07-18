/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import execa from 'execa';
import si from 'systeminformation';
import toBytes from 'bytes';
import { CoreContext, CoreResult } from '@app/core/types';
import { AppError } from '@app/core/errors/app-error';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { cleanStdout } from '@app/core/utils/misc/clean-stdout';

/**
 * Get memory.
 */
export const getMemory = async (context: CoreContext): Promise<CoreResult> => {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'memory',
		action: 'read',
		possession: 'any',
	});

	const layout = await si.memLayout();
	const info = await si.mem();
	let max = info.total;

	// Max memory
	try {
		const memoryInfo = await execa('dmidecode', ['-t', 'memory'])
			.then(cleanStdout)
			.catch((error: NodeJS.ErrnoException) => {
				if (error.code === 'ENOENT') {
					throw new AppError('The dmidecode cli utility is missing.');
				}

				throw error;
			});
		const lines = memoryInfo.split('\n');
		const header = lines.find(line => line.startsWith('Physical Memory Array'))!;
		const start = lines.indexOf(header);
		const nextHeaders = lines.slice(start, -1).find(line => line.startsWith('Handle '))!;
		const end = lines.indexOf(nextHeaders);
		const fields = lines.slice(start, end);
		max = toBytes(fields.find(line => line.trim().startsWith('Maximum Capacity'))!.trim().split(': ')[1]);
	} catch {}

	const result = {
		layout,
		max,
		...info,
	};

	return {
		json: result,
	};
};
