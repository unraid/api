import { execa } from 'execa';

import { type CoreContext, type CoreResult } from '@app/core/types';
import { cleanStdout } from '@app/core/utils/misc/clean-stdout';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';

interface Result extends CoreResult {
    json: {
        online: boolean;
        uptime: number;
    };
}

/**
 * Get emhttpd service info.
 */
export const getEmhttpdService = async (context: CoreContext): Promise<Result> => {
    const { user } = context;

    // Check permissions
    ensurePermission(user, {
        resource: 'service/emhttpd',
        action: 'read',
        possession: 'any',
    });

    // Only get uptime if process is online
    const uptime = await execa('ps', ['-C', 'emhttpd', '-o', 'etimes', '--no-headers'])
        .then(cleanStdout)
        .then((uptime) => Number.parseInt(uptime, 10))
        .catch(() => -1);

    const online = uptime >= 1;

    return {
        text: `Online: ${online}\n Uptime: ${uptime}`,
        json: {
            online,
            uptime,
        },
    };
};
