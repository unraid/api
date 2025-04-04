import { got } from 'got';

import { AppError } from '@app/core/errors/app-error.js';
import { logger } from '@app/core/log.js';
import { type LooseObject } from '@app/core/types/index.js';
import { DRY_RUN } from '@app/environment.js';
import { getters } from '@app/store/index.js';
import { PathsConfig } from '../../../config/paths.config.js';

/**
 * Run a command with emcmd.
 */
export const emcmd = async (commands: LooseObject) => {
    const paths = PathsConfig.getInstance();
    const socketPath = paths.emhttpdSocket;
    const { csrfToken } = getters.emhttp().var;

    const url = `http://unix:${socketPath}:/update.htm`;
    const options = {
        qs: {
            ...commands,
            csrf_token: csrfToken,
        },
    };

    if (DRY_RUN) {
        logger.debug(url, options);

        // Ensure we only log on dry-run
        return;
    }
    return got
        .get(url, {
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

export const createEmcmdClient = () => {
    const paths = PathsConfig.getInstance();
    const socketPath = paths.emhttpdSocket;
    // Rest of implementation
};
