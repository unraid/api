/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { getEmhttpdService } from '@app/core/modules/services/get-emhttpd';
import { logger } from '@app/core/log';
import { envs } from '@app/core/envs';
import type { CoreResult, CoreContext } from '@app/core/types';
import { getUnraidApiService } from '@app/core/modules/services/get-unraid-api';

const devNames = [
	'emhttpd',
	'rest-api'
];

const coreNames = [
	'unraid-api'
];

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
const addNameToService = (services: ServiceResult[], names: string[]): ServiceWithName[] => {
	return services.map((service, index) => ({
		name: names[index],
		...service.json
	}));
};

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

	const devServices: ServiceResult[] = envs.NODE_ENV === 'development' ? await Promise.all([
		getEmhttpdService(context)
	]).catch(logErrorAndReturnEmptyArray) as ServiceResult[] : [];

	const coreServices: ServiceResult[] = await Promise.all([
		getUnraidApiService(context)
	]).catch(logErrorAndReturnEmptyArray) as ServiceResult[];

	const result = [
		...addNameToService(devServices, devNames),
		...addNameToService(coreServices, coreNames)
	];

	return {
		text: `Services: ${JSON.stringify(result, null, 2)}`,
		json: result
	};
};
