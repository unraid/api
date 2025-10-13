import { readFile } from 'node:fs/promises';

import { got } from 'got';
import * as ini from 'ini';
import retry from 'p-retry';

import { AppError } from '@app/core/errors/app-error.js';
import { appLogger } from '@app/core/log.js';
import { LooseObject } from '@app/core/types/global.js';
import { store } from '@app/store/index.js';
import { loadSingleStateFile } from '@app/store/modules/emhttp.js';
import { StateFileKey } from '@app/store/types.js';

const VAR_INI_PATH = '/var/local/emhttp/var.ini';

const readCsrfTokenFromVarIni = async (): Promise<string | undefined> => {
    try {
        const iniContents = await readFile(VAR_INI_PATH, 'utf-8');
        const parsed = ini.parse(iniContents) as { csrf_token?: string };
        return parsed?.csrf_token;
    } catch (error) {
        appLogger.debug(`Unable to read CSRF token from ${VAR_INI_PATH}: %o`, error);
        return undefined;
    }
};

const ensureCsrfToken = async (
    currentToken: string | undefined,
    waitForToken: boolean
): Promise<string | undefined> => {
    if (currentToken) {
        return currentToken;
    }

    const tokenFromIni = await readCsrfTokenFromVarIni();
    if (tokenFromIni) {
        return tokenFromIni;
    }

    if (!waitForToken) {
        return undefined;
    }

    return retry(
        async (retries) => {
            if (retries > 1) {
                appLogger.info('Waiting for CSRF token...');
            }
            const loadedState = await store.dispatch(loadSingleStateFile(StateFileKey.var)).unwrap();

            const token = loadedState && 'var' in loadedState ? loadedState.var.csrfToken : undefined;
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
};

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

    const stateToken = getters.emhttp().var?.csrfToken;
    const csrfToken = await ensureCsrfToken(stateToken, waitForToken);

    appLogger.debug(`Executing emcmd with commands: ${JSON.stringify(commands)}`);

    try {
        const params = new URLSearchParams();
        Object.entries({ ...commands }).forEach(([key, value]) => {
            const stringValue = value == null ? '' : String(value);
            params.append(key, stringValue);
        });
        params.append('csrf_token', csrfToken ?? '');

        const response = await got.post(`http://unix:${socketPath}:/update`, {
            enableUnixSockets: true,
            body: params.toString(),
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
            throwHttpErrors: false,
        });

        if (response.statusCode >= 400) {
            throw new Error(`emcmd request failed with status ${response.statusCode}`);
        }

        const trimmedBody = response.body?.trim();
        if (trimmedBody) {
            throw new Error(trimmedBody);
        }

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
