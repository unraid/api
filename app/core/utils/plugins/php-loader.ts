/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import path from 'node:path';
import execa from 'execa';
import { PhpError, FileMissingError } from '../../errors';
import { LooseObject, LooseStringObject } from '../../types';
import { fileURLToPath } from 'node:url';

/**
 * Encode GET/POST params.
 *
 * @param params Keys/values to be encoded.
 * @ignore
 * @private
 */
const encodeParameters = (parameters: LooseObject) => {
	// Join query params together
	return Object.entries(parameters).map(kv => {
		// Encode each section and join
		return kv.map(keyValuePair => encodeURIComponent(keyValuePair)).join('=');
	}).join('&');
};

interface Options {
	/** File path */
	file: string;
	/** HTTP Method GET/POST */
	method?: string;
	/** Request query */
	query?: LooseStringObject;
	/** Request body */
	body?: LooseObject;
}

/**
 * Load a PHP file.
 */
export const phpLoader = async (options: Options) => {
	const { file, method = 'GET', query = {}, body = {} } = options;
	const options_ = [
		'./wrapper.php',
		method,
		`${file}${Object.keys(query).length > 0 ? ('?' + encodeParameters(query)) : ''}`,
		encodeParameters(body)
	];
	const __dirname = path.dirname(fileURLToPath(import.meta.url));

	return execa('php', options_, { cwd: __dirname })
		.then(({ stdout }) => {
			// Missing php file
			if (stdout.includes(`Warning: include(${file}): failed to open stream: No such file or directory in ${path.join(__dirname, '/wrapper.php')}`)) {
				throw new FileMissingError(file);
			}

			return stdout;
		})
		.catch(error => {
			throw new PhpError(error);
		});
};
