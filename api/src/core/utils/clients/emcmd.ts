import { got } from 'got';
import retry from 'p-retry';

import { AppError } from '@app/core/errors/app-error.js';
import { appLogger } from '@app/core/log.js';
import { type LooseObject } from '@app/core/types/index.js';
import { type Var } from '@app/core/types/states/var.js';
import { store } from '@app/store/index.js';
import { loadSingleStateFile } from '@app/store/modules/emhttp.js';
import { FileLoadStatus, StateFileKey } from '@app/store/types.js';
import { ArrayDisk } from '@app/unraid-api/graph/resolvers/array/array.model.js';

/**
 * Run a command with emcmd.
 */
export const emcmd = async (
    commands: LooseObject,
    { waitForToken = false }: { waitForToken?: boolean } = {}
) => {
    const { getters } = await import('@app/store/index.js');
    const socketPath = getters.paths()['emhttpd-socket'];

    if (!socketPath) {
        throw new AppError('No emhttpd socket path found');
    }

    let { csrfToken } = getters.emhttp().var;

    if (!csrfToken && waitForToken) {
        csrfToken = await retry(
            async (retries) => {
                if (retries > 1) {
                    appLogger.info('Waiting for CSRF token...');
                }
                const loadedState = await store.dispatch(loadSingleStateFile(StateFileKey.var)).unwrap();

                let token: string | undefined;
                if (loadedState && 'var' in loadedState) {
                    token = loadedState.var.csrfToken;
                }
                if (!token) {
                    throw new Error('CSRF token not found yet');
                }
                return token;
            },
            {
                minTimeout: 5000,
                maxTimeout: 10000,
                retries: 10,
            }
        ).catch(() => {
            throw new AppError('Failed to load CSRF token after multiple retries');
        });
    }

    return got
        .post(`http://unix:${socketPath}:/update.htm`, {
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
