/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { Express } from 'express';
import expressListEndpoints from 'express-list-endpoints';
import flatten from 'flatten';
import { removeDuplicatesFromArray } from '@app/core/utils/misc/remove-duplicates-from-array';

/**
 * Get array of endpoints with associated methods from express router.
 */
export const getEndpoints = (app: Express) => {
	const endpoints = expressListEndpoints(app);
	const deDeupedEndpoints = removeDuplicatesFromArray(endpoints, 'path');

	return deDeupedEndpoints.map(endpoint => {
		const flattenedMethods: string[] = flatten([
			// @ts-expect-error
			endpoint.methods,
			// @ts-expect-error
			endpoints.filter(({ path }) => path === endpoint.path).map(({ methods }) => methods)
		]);

		const methods = flattenedMethods.filter((item, pos, self) => self.indexOf(item) === pos);

		return {
			// @ts-expect-error
			...endpoint,
			methods
		};
	});
};
