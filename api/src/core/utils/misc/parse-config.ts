/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */
import { parse as parseIni } from 'ini';
import camelCaseKeys from 'camelcase-keys';
import { includeKeys } from 'filter-obj';
import mapObject from 'map-obj';
import { AppError } from '@app/core/errors/app-error';
import { accessSync, readFileSync } from 'fs';
import { access } from 'fs/promises';
import { F_OK } from 'constants';
import { extname } from 'path';

type ConfigType = 'ini' | 'cfg';

type OptionsWithPath = {
	/** Relative or absolute file path. */
	filePath: string;
	/** If the file is an "ini" or a "cfg". */
	type?: ConfigType;
};

type OptionsWithLoadedFile = {
	file: string;
	type: ConfigType;
};

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

export const fileExists = async (path: string) => access(path, F_OK).then(() => true).catch(() => false);
export const fileExistsSync = (path: string) => {
	try {
		accessSync(path, F_OK);
		return true;
	} catch (error: unknown) {
		return false;
	}
};

export const getExtensionFromPath = (filePath: string): string => extname(filePath);

const isFilePathOptions = (options: OptionsWithLoadedFile | OptionsWithPath): options is OptionsWithPath => Object.keys(options).includes('filePath');
const isFileOptions = (options: OptionsWithLoadedFile | OptionsWithPath): options is OptionsWithLoadedFile => Object.keys(options).includes('file');

export const loadFileFromPathSync = (filePath: string): string => {
	if (!fileExistsSync(filePath)) throw new Error(`Failed to load file at path: ${filePath}`);
	const file = readFileSync(filePath, 'utf-8').toString();
	if (file === '') {
		throw new AppError('File contents are empty, this is an invalid read operation');
	}

	return file;
};

/**
 *
 * @param extension File extension
 * @returns boolean whether extension is ini or cfg
 */
const isValidConfigExtension = (extension: string): boolean => ['ini', 'cfg'].includes(extension);

export const parseConfig = <T extends Record<string, any>>(options: OptionsWithLoadedFile | OptionsWithPath): T => {
	let fileContents: string;
	let extension: string;

	if (isFilePathOptions(options)) {
		const { filePath, type } = options;

		const validFile = fileExistsSync(filePath);
		extension = type ?? getExtensionFromPath(filePath);
		const validExtension = isValidConfigExtension(extension);

		if (validFile && validExtension) {
			fileContents = loadFileFromPathSync(options.filePath);
		} else {
			throw new AppError(`Invalid File Path: ${options.filePath}, or Extension: ${extension}`);
		}
	} else if (isFileOptions(options)) {
		const { file, type } = options;
		fileContents = file;
		const extension = type;
		if (!isValidConfigExtension(extension)) {
			throw new AppError(`Invalid Extension for Ini File: ${extension}`);
		}
	} else {
		throw new AppError('Invalid Parameters Passed to ParseConfig');
	}

	const data: Record<string, any> = parseIni(fileContents);
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
