import type { CoreContext, CoreResult } from '@app/core/types/index.js';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission.js';
import { API_VERSION } from '@app/environment.js';

interface Result extends CoreResult {
    json: {
        name: string;
        online: boolean;
        uptime: {
            timestamp: string;
            seconds: number;
        };
    };
}

// When this service started
const startTimestamp = new Date();

/**
 * Get Unraid api service info.
 */
export const getUnraidApiService = async (context: CoreContext): Promise<Result> => {
    // Check permissions
    ensurePermission(context.user, {
        resource: 'service/unraid-api',
        action: 'read',
        possession: 'any',
    });

    const now = new Date();
    const uptimeTimestamp = startTimestamp.toISOString();
    const uptimeSeconds = now.getTime() - startTimestamp.getTime();

    const service = {
        name: 'unraid-api',
        online: true,
        uptime: {
            timestamp: uptimeTimestamp,
            seconds: uptimeSeconds,
        },
        version: API_VERSION,
    };

    return {
        json: service,
    };
};
