import { got } from 'got';

import { AppError } from '@app/core/errors/app-error.js';
import { type LooseObject } from '@app/core/types/index.js';

/**
 * Run a command with emcmd.
 */
export const emcmd = async (commands: LooseObject) => {
    const { getters } = await import('@app/store/index.js');
    const socketPath = getters.paths()['emhttpd-socket'];

    if (!socketPath) {
        throw new AppError('No emhttpd socket path found');
    }

    const { csrfToken } = getters.emhttp().var;

    if (!csrfToken) {
        throw new AppError('No CSRF token found');
    }

    const url = `http://unix:${socketPath}:/update.htm`;
    const options = {
        qs: {
            ...commands,
            csrf_token: csrfToken,
        },
    };

    return got
        .post(url, {
            enableUnixSockets: true,
            searchParams: { ...commands, csrf_token: csrfToken },
        })
        .catch((error: NodeJS.ErrnoException) => {
            if (error.code === 'ENOENT') {
                throw new AppError('emhttpd socket unavailable.');
            }
            throw error;
        });
};
