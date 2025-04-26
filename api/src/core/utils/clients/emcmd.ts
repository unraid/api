import { got } from 'got';

import { AppError } from '@app/core/errors/app-error.js';
import { appLogger } from '@app/core/log.js';
import { type LooseObject } from '@app/core/types/index.js';
import { store } from '@app/store/index.js';
import { loadSingleStateFile } from '@app/store/modules/emhttp.js';
import { StateFileKey } from '@app/store/types.js';

/**
 * Run a command with emcmd.
 */
export const emcmd = async (commands: LooseObject) => {
    const { getters } = await import('@app/store/index.js');
    const socketPath = getters.paths()['emhttpd-socket'];

    if (!socketPath) {
        throw new AppError('No emhttpd socket path found');
    }

    let { csrfToken } = getters.emhttp().var;

    if (!csrfToken) {
        appLogger.warn('No CSRF token found - attempting to load var state file manually');
        const state = await store.dispatch(loadSingleStateFile(StateFileKey.var)).unwrap();
        if (state && 'var' in state) {
            csrfToken = state.var.csrfToken;
        }
        if (!csrfToken) {
            throw new AppError('No CSRF token found');
        }
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
