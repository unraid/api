/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { getEmhttpdService, getNodeApiService } from './services';
import { coreLogger } from '../log';
import { envs } from '../envs';
import { NodeService } from '../utils';
import { CoreResult, CoreContext } from '../types';

const devNames = [
	'emhttpd',
	'rest-api'
];

const coreNames = [
	'node-api'
];

interface ServiceResult extends CoreResult {
	json: NodeService;
}

interface NodeServiceWithName extends NodeService {
	name: string;
}

/**
 * Add name to services.
 *
 * @param services
 * @param names
 */
const addNameToService = (services: ServiceResult[], names: string[]): NodeServiceWithName[] => {
	return services.map((service, index) => ({
		name: names[index],
		...service.json
	}));
};

interface Result extends CoreResult {
	json: NodeServiceWithName[];
}

/**
 * Get all services.
 */
export const getServices = async(context: CoreContext): Promise<Result> => {
	const logErrorAndReturnEmptyArray = (error: Error) => {
		coreLogger.error(error);
		return [];
	};

	const devServices = envs.NODE_ENV === 'development' ? await Promise.all([
		getEmhttpdService(context)
	]).catch(logErrorAndReturnEmptyArray) : [];

	const coreServices = await Promise.all([
		getNodeApiService(context)
	]).catch(logErrorAndReturnEmptyArray);

	const result = [
		...addNameToService(devServices, devNames),
		...addNameToService(coreServices, coreNames)
	];

	return {
		text: `Services: ${JSON.stringify(result, null, 2)}`,
		json: result
	};
};
