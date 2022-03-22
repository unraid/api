/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import fs from 'fs';
import { read as multiIniRead, Parser as MultiIniParser } from 'multi-ini';
import ini from 'ini';
import camelCaseKeys from 'camelcase-keys';
import filterObject from 'filter-obj';
import mapObject from 'map-obj';
import { paths } from '../../paths';
import { AppError } from '../../errors';

type ConfigType = 'ini' | 'cfg';

interface Options {
	/** Relative or absolute file path. */
	filePath?: string;
	/** A string containing the raw file contents. */
	file?: string;
	/** If the file is an "ini" or a "cfg". */
	type: ConfigType;
}

/**
 * Converts the following
 * ```
 * {
 * 	'ipaddr:0': '0.0.0.0',
 * 	'ipaddr:1': '1.1.1.1'
 * }
 * ```
 * to this.
 * ```
 * {
 * 	'ipaddr': ['0.0.0.0', '1.1.1.1']
 * }
 * ```
 */
const fixObjectArrays = (object: Record<string, any>) => {
	// An object of arrays for keys that end in `:${number}`
	const temporaryArrays = {};

	// An object without any array items
	const filteredObject = filterObject(object, (key, value) => {
		// eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
		const [_, name, index] = [...((key).match(/(.*):(\d+$)/) ?? [])];
		if (!name || !index) {
			return true;
		}

		// Create inital array
		if (!Array.isArray(temporaryArrays[name])) {
			temporaryArrays[name] = [];
		}

		// Add value
		temporaryArrays[name].push(value);

		// Remove the old field
		return false;
	});

	return {
		...filteredObject,
		...temporaryArrays
	};
};

/**
 * Parse ini and cfg files.
 */
export const parseConfig = <T>(options: Options): T => {
	const { file, type } = options;
	const filePath = paths[options.filePath as keyof typeof paths] ?? options.filePath;
	const fileContents = filePath ? fs.readFileSync(filePath, 'utf8').toString() : file!;
	const fileType = type || filePath.split('.').splice(-1)[0];

	// Only allow ini and cfg files.
	if (!['ini', 'cfg'].includes(fileType)) {
		throw new AppError('Invalid file extension.');
	}

	// Parse file
	let data: Record<string, any>;
	if (filePath) {
		data = multiIniRead(filePath, {
			keep_quotes: false
		});
	} else {
		const parser = new MultiIniParser();
		data = parser.parse(fileContents);
	}

	// If multi-ini failed try ini
	if (fileContents.length >= 1 && Object.keys(data).length === 0) {
		data = ini.parse(fileContents);
	}

	// Remove quotes around keys
	const dataWithoutQuoteKeys = mapObject(data, (key, value) => {
		// @SEE: https://stackoverflow.com/a/19156197/2311366
		return [(key).replace(/^"(.+(?="$))"$/, '$1'), value];
	});

	// Result object with array items as actual arrays
	const result = Object.fromEntries(
		Object.entries(dataWithoutQuoteKeys)
			.map(([key, value]) => {
				return [key, typeof value === 'object' ? fixObjectArrays(value) : value];
			})
	);

	// Convert all keys to camel case
	// @ts-expect-error
	return camelCaseKeys(result, {
		deep: true
	});
};
