/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { Parser as MultiIniParser } from 'multi-ini';
import { parse as parseIni } from 'ini';
import camelCaseKeys from 'camelcase-keys';
import { includeKeys } from 'filter-obj';
import mapObject from 'map-obj';
import { AppError } from '@app/core/errors/app-error';
import { fileExistsSync } from '@app/core/utils/files/file-exists';
import { getExtensionFromPath } from '@app/core/utils/files/get-extension-from-path';
import { loadFileFromPathSync } from '@app/core/utils/files/load-file-from-path';

type ConfigType = 'ini' | 'cfg';

interface OptionsWithPath {
	/** Relative or absolute file path. */
	filePath: string;
	type?: ConfigType;
	/** If the file is an "ini" or a "cfg". */
}

interface OptionsWithLoadedFile {
	file: string;
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
	const filteredObject = includeKeys(object, (key, value) => {
		// eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
		const [_, name, index] = [...((key).match(/(.*):(\d+$)/) ?? [])];
		if (!name || !index) {
			return true;
		}

		// Create initial array
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
		...temporaryArrays,
	};
};

/**
 *
 * @param extension File extension
 * @returns boolean whether extension is ini or cfg
 */
const isValidConfigExtension = (extension: string): boolean => {
	if (!['ini', 'cfg'].includes(extension)) {
		return false;
	}

	return true;
};

/**
 * @param fileContents ini or cfg file to parse with ini parser
 * @returns Parsed file as Record<string, any>
 */
const readIniFromString = (fileContents: string): Record<string, any> => {
	const parser = new MultiIniParser();
	let data: Record<string, any>;
	data = parser.parse(fileContents, { keep_quotes: false });

	// If multi-ini failed try ini
	if (fileContents && fileContents.length >= 1 && Object.keys(data).length === 0) {
		data = parseIni(fileContents);
	}

	return data;
};

/**
 * Parse Ini or Cfg File
 */
export const parseConfig = <T>(options: OptionsWithLoadedFile | OptionsWithPath): T => {
	let fileContents: string;
	let extension: string;

	if ('filePath' in options) {
		const { filePath, type } = options;

		const validFile = fileExistsSync(filePath);
		extension = type ?? getExtensionFromPath(filePath);
		const validExtension = isValidConfigExtension(extension);

		if (validFile && validExtension) {
			fileContents = loadFileFromPathSync(options.filePath);
		} else {
			throw new AppError(`Invalid File Path: ${options.filePath}, or Extension: ${extension}`);
		}
	} else if ('file' in options) {
		const { file, type } = options;
		fileContents = file;
		const extension = type;
		if (!isValidConfigExtension(extension)) {
			throw new AppError(`Invalid Extension for Ini File: ${extension}`);
		}
	} else {
		throw new AppError('Invalid Parameters Passed to ParseConfig');
	}

	const data: Record<string, any> = readIniFromString(fileContents);
	// Remove quotes around keys
	const dataWithoutQuoteKeys = mapObject(data, (key, value) =>
		// @SEE: https://stackoverflow.com/a/19156197/2311366
		[(key).replace(/^"(.+(?="$))"$/, '$1'), value],
	);

	// Result object with array items as actual arrays
	const result = Object.fromEntries(
		Object.entries(dataWithoutQuoteKeys)
			.map(([key, value]) => [key, typeof value === 'object' ? fixObjectArrays(value) : value]),
	);

	// Convert all keys to camel case
	return camelCaseKeys(result, {
		deep: true,
	}) as T;
};
