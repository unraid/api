import { got } from 'got';
import retry from 'p-retry';

import { AppError } from '@app/core/errors/app-error.js';
import { appLogger } from '@app/core/log.js';
import { LooseObject } from '@app/core/types/global.js';
import { store } from '@app/store/index.js';
import { loadSingleStateFile } from '@app/store/modules/emhttp.js';
import { StateFileKey } from '@app/store/types.js';

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
        appLogger.error('No emhttpd socket path found');
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
        ).catch((error) => {
            appLogger.error('Failed to load CSRF token after multiple retries', error);
            throw new AppError('Failed to load CSRF token after multiple retries');
        });
    }

    appLogger.debug(`Executing emcmd with commands: ${JSON.stringify(commands)}`);

    try {
        const paramsObj = { ...commands, csrf_token: csrfToken };
        const params = new URLSearchParams(paramsObj);
        const response = await got.get(`http://unix:${socketPath}:/update.htm`, {
            enableUnixSockets: true,
            searchParams: params,
        });

        appLogger.debug('emcmd executed successfully');
        return response;
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            appLogger.error('emhttpd socket unavailable.', error);
            throw new Error('emhttpd socket unavailable.');
        }
        appLogger.error(`emcmd execution failed: ${error.message}`, error);
        throw error;
    }
};
