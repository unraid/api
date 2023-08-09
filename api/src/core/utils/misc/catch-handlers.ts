import { AppError } from '@app/core/errors/app-error';
import { getters } from '@app/store';

interface DockerError extends NodeJS.ErrnoException {
	address: string;
}

/**
 * Shared catch handlers.
 */
export const catchHandlers = {
	docker(error: DockerError) {
		const socketPath = getters.paths()['docker-socket'];

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
