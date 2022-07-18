/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { paths } from '@app/core/paths';
import { AppError } from '@app/core/errors/app-error';

interface DockerError extends NodeJS.ErrnoException {
	address: string;
}

/**
 * Shared catch handlers.
 */
export const catchHandlers = {
	docker(error: DockerError) {
		const socketPath = paths['docker-socket'];

		// Throw custom error for docker socket missing
		if (error.code === 'ENOENT' && error.address === socketPath) {
			throw new AppError('Docker socket unavailable.');
		}

		throw error;
	},
	emhttpd(error: NodeJS.ErrnoException) {
		if (error.code === 'ENOENT') {
			throw new AppError('emhttpd socket unavailable.');
		}

		throw error;
	},
};
