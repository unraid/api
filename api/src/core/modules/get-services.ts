import type { CoreContext, CoreResult } from '@app/core/types/index.js';
import { logger } from '@app/core/log.js';
import { getEmhttpdService } from '@app/core/modules/services/get-emhttpd.js';
import { getUnraidApiService } from '@app/core/modules/services/get-unraid-api.js';

const devNames = ['emhttpd', 'rest-api'];

const coreNames = ['unraid-api'];

interface Service {
    online: boolean;
    uptime: string;
    version: string;
}

interface ServiceResult extends CoreResult {
    json: Service;
}

interface ServiceWithName extends Service {
    name: string;
}

/**
 * Add name to services.
 *
 * @param services
 * @param names
 */
const addNameToService = (services: ServiceResult[], names: string[]): ServiceWithName[] =>
    services.map((service, index) => ({
        name: names[index],
        ...service.json,
    }));

interface Result extends CoreResult {
    json: ServiceWithName[];
}

/**
 * Get all services.
 */
export const getServices = async (context: CoreContext): Promise<Result> => {
    const logErrorAndReturnEmptyArray = (error: Error) => {
        logger.error(error);
        return [];
    };

    const devServices: ServiceResult[] = (await Promise.all([getEmhttpdService(context)]).catch(
        logErrorAndReturnEmptyArray
    )) as ServiceResult[];

    const coreServices: ServiceResult[] = (await Promise.all([getUnraidApiService(context)]).catch(
        logErrorAndReturnEmptyArray
    )) as ServiceResult[];

    const result = [
        ...addNameToService(devServices, devNames),
        ...addNameToService(coreServices, coreNames),
    ];

    return {
        json: result,
    };
};
