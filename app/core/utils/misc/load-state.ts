/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import camelCaseKeys from 'camelcase-keys';
import { logger } from '../../log';
import { parseConfig } from './parse-config';

/**
 * Loads state from path.
 * @param filePath Path to state file.
 */
export const loadState = <T>(filePath: string): T => {
	const config = camelCaseKeys(parseConfig<T>({
		filePath,
		type: 'ini'
	}), {
		deep: true
	}) as T;

	logger.addContext('config', config);
	logger.trace('"%s" was loaded', filePath);
	logger.removeContext('config');

	return config;
};
