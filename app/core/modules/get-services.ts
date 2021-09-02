/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { getEmhttpService, getUnraidApiService } from './services';
import { coreLogger } from '../log';
import { environmentVariables } from '../environments';
import { CoreResult, CoreContext } from '../types';

const devNames = [
	'emhttpd',
	'rest-api'
];

const coreNames = [
	'unraid-api'
];

interface Uptime {
	timestamp: string;
	seconds?: number;
}

interface NodeService {
	name: string;
	online?: boolean;
	uptime: Uptime;
	version?: string;
}

interface ServiceResult extends CoreResult<NodeService> {
	json: NodeService;
}

interface NodeServiceWithName extends NodeService {
	name: string;
}

/**
 * Add name to results.
 *
 * @param results
 * @param names
 */
const addNameToResult = (results: Array<Result | ServiceResult>, names: string[]): NodeServiceWithName[] => {
	return results.map((result, index) => {
		const { name: _name, ...ResultData } = result.json;
		return ({
			name: names[index],
			...ResultData
		});
	});
};

interface Result extends CoreResult<NodeServiceWithName[]> {
	json: NodeServiceWithName[];
}

const logErrorAndReturnEmptyArray = (error: Error) => {
	coreLogger.error(error);
	return [];
};

/**
 * Get all services.
 */
export const getServices = async (context: CoreContext): Promise<Result> => {
	const devServices = environmentVariables.NODE_ENV === 'development' ? await Promise.all([
		getEmhttpService(context)
	]).catch(logErrorAndReturnEmptyArray) : [];

	const coreServices = await Promise.all([
		getUnraidApiService(context)
	]).catch(logErrorAndReturnEmptyArray);

	const result = [
		...addNameToResult(devServices, devNames),
		...addNameToResult(coreServices, coreNames)
	];

	return {
		text: `Services: ${JSON.stringify(result, null, 2)}`,
		json: result
	};
};
