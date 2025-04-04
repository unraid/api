import { AppError } from '@app/core/errors/app-error.js';
import { getters } from '@app/store/index.js';
import { PathsConfig } from '../../../config/paths.config.js';

interface DockerError extends NodeJS.ErrnoException {
    address: string;
}

/**
 * Shared catch handlers.
 */
export const catchHandlers = {
    docker(error: DockerError) {
        const paths = PathsConfig.getInstance();
        const socketPath = paths.dockerSocket;

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

export const handleDockerError = (error: Error) => {
    const paths = PathsConfig.getInstance();
    const socketPath = paths.dockerSocket;
    // Rest of implementation
};
