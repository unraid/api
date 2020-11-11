/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import camelCaseKeys from 'camelcase-keys';
import { parseConfig } from './parse-config';

/**
 * Loads state from path.
 * @param filePath Path to state file.
 */
export const loadState = <T>(filePath: string): T => {
	const config = parseConfig({
		filePath,
		type: 'ini'
	});

	// @ts-ignore
	return camelCaseKeys(config, {
		deep: true
	});
};
