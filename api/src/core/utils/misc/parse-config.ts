import { F_OK } from 'constants';
import { accessSync, readFileSync } from 'fs';
import { access } from 'fs/promises';
import { extname } from 'path';

import camelCaseKeys from 'camelcase-keys';
import { parse as parseIni } from 'ini';

import { AppError } from '@app/core/errors/app-error.js';
import { fileExistsSync } from '@app/core/utils/files/file-exists.js';

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
 * Flattens nested objects that were incorrectly created by periods in INI section names.
 * For example: { system: { with: { periods: {...} } } } -> { "system.with.periods": {...} }
 */
const flattenPeriodSections = (obj: Record<string, any>, prefix = ''): Record<string, any> => {
    const result: Record<string, any> = {};
    const isNestedObject = (value: unknown) =>
        Boolean(value && typeof value === 'object' && !Array.isArray(value));
    // prevent prototype pollution/injection
    const isUnsafeKey = (k: string) => k === '__proto__' || k === 'prototype' || k === 'constructor';

    for (const [key, value] of Object.entries(obj)) {
        if (isUnsafeKey(key)) continue;
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (!isNestedObject(value)) {
            result[fullKey] = value;
            continue;
        }

        const section = {};
        const nestedObjs = {};
        let hasSectionProps = false;

        for (const [propKey, propValue] of Object.entries(value)) {
            if (isUnsafeKey(propKey)) continue;
            if (isNestedObject(propValue)) {
                nestedObjs[propKey] = propValue;
            } else {
                section[propKey] = propValue;
                hasSectionProps = true;
            }
        }

        // Process direct properties first to maintain order
        if (hasSectionProps) {
            result[fullKey] = section;
        }

        // Then process nested objects
        if (Object.keys(nestedObjs).length > 0) {
            Object.assign(result, flattenPeriodSections(nestedObjs, fullKey));
        }
    }

    return result;
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
    const filteredObject = Object.fromEntries(
        Object.entries(object).filter(([key, value]) => {
            const match = key.match(/(.*):(\d+$)/);
            if (!match) {
                return true;
            }

            const [, name, index] = match;
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
        })
    );

    return {
        ...filteredObject,
        ...temporaryArrays,
    };
};

export const getExtensionFromPath = (filePath: string): string => extname(filePath);

const normalizeExtension = (extension: string): string => {
    if (!extension) {
        return extension;
    }
    return extension.startsWith('.') ? extension.slice(1).toLowerCase() : extension.toLowerCase();
};

const isFilePathOptions = (
    options: OptionsWithLoadedFile | OptionsWithPath
): options is OptionsWithPath => Object.keys(options).includes('filePath');
const isFileOptions = (
    options: OptionsWithLoadedFile | OptionsWithPath
): options is OptionsWithLoadedFile => Object.keys(options).includes('file');

export const loadFileFromPathSync = (filePath: string): string => {
    if (!fileExistsSync(filePath)) throw new Error(`Failed to load file at path: ${filePath}`);
    return readFileSync(filePath, 'utf-8').toString();
};

/**
 *
 * @param extension File extension
 * @returns boolean whether extension is ini or cfg
 */
const isValidConfigExtension = (extension: string): boolean => {
    const normalized = normalizeExtension(extension);
    return ['ini', 'cfg'].includes(normalized);
};

export const parseConfig = <T extends Record<string, any>>(
    options: OptionsWithLoadedFile | OptionsWithPath
): T => {
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

    let data: Record<string, any>;
    try {
        data = parseIni(fileContents);
        // Fix nested objects created by periods in section names
        data = flattenPeriodSections(data);
    } catch (error) {
        throw new AppError(
            `Failed to parse config file: ${error instanceof Error ? error.message : String(error)}`
        );
    }

    // Remove quotes around keys
    const dataWithoutQuoteKeys = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key.replace(/^"(.+(?="$))"$/, '$1'), value])
    );

    // Result object with array items as actual arrays
    const result = Object.fromEntries(
        Object.entries(dataWithoutQuoteKeys).map(([key, value]) => [
            key,
            typeof value === 'object' ? fixObjectArrays(value) : value,
        ])
    );

    // Convert all keys to camel case
    return camelCaseKeys(result, {
        deep: true,
    }) as T;
};
