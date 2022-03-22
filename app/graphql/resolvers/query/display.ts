/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { join } from 'path';
import { promises as fs, statSync, existsSync } from 'fs';
import { paths, logger } from '../../../core';

// Consts
const ONE_BYTE = 1;
const ONE_KILOBYTE = ONE_BYTE * 1000;
const ONE_MEGABYTE = ONE_KILOBYTE * 1000;
const FIVE_MEGABYTE = ONE_MEGABYTE * 5;

const isOverFileSizeLimit = (filePath, limit = FIVE_MEGABYTE) => {
	try {
		const stats = statSync(filePath);
		const fileSizeInBytes = stats.size;
		return fileSizeInBytes > limit;
	} catch {
		// File likely doesn't exist or there was another error
		return true;
	}
};

const states = {
	// Success
	custom: {
		url: '',
		icon: 'custom',
		error: '',
		base64: ''
	},
	default: {
		url: '',
		icon: 'default',
		error: '',
		base64: ''
	},

	// Errors
	couldNotReadConfigFile: {
		url: '',
		icon: 'custom',
		error: 'could-not-read-config-file',
		base64: ''
	},
	couldNotReadImage: {
		url: '',
		icon: 'custom',
		error: 'could-not-read-image',
		base64: ''
	},
	imageMissing: {
		url: '',
		icon: 'custom',
		error: 'image-missing',
		base64: ''
	},
	imageTooBig: {
		url: '',
		icon: 'custom',
		error: 'image-too-big',
		base64: ''
	},
	imageCorrupt: {
		url: '',
		icon: 'custom',
		error: 'image-corrupt',
		base64: ''
	}
};

export default async () => {
	const dynamixBasePath = paths['dynamix-base'];
	const configFilePath = join(dynamixBasePath, 'case-model.cfg');
	const customImageFilePath = join(dynamixBasePath, 'case-model.png');

	// If the config file doesn't exist then it's a new OS install
	// Default to "default"
	if (!existsSync(configFilePath)) {
		return { case: states.default };
	}

	// Attempt to get case from file
	const serverCase = await fs.readFile(configFilePath)
		.then(buffer => buffer.toString().split('\n')[0])
		.catch(() => 'error_reading_config_file');

	// Config file can't be read, maybe a permissions issue?
	if (serverCase === 'error_reading_config_file') {
		return { case: states.couldNotReadConfigFile };
	}

	// Custom icon
	if (serverCase.includes('.')) {
		// Ensure image exists
		if (!existsSync(customImageFilePath)) {
			return { case: states.imageMissing };
		}

		// Ensure we're within size limits
		if (isOverFileSizeLimit(customImageFilePath)) {
			logger.debug('"custom-case.png" is too big.');
			return { case: states.imageTooBig };
		}

		try {
			// Get image buffer
			const fileBuffer = await fs.readFile(customImageFilePath);

			// Likely not an actual image
			// 73 bytes is close to the smallest we can get https://garethrees.org/2007/11/14/pngcrush/
			if (fileBuffer.length <= 25) {
				return {
					case: states.couldNotReadImage
				};
			}

			return {
				case: {
					...states.custom,
					base64: fileBuffer.toString('base64'),
					url: serverCase
				}
			};
		} catch (error: unknown) {
			return {
				case: states.couldNotReadImage
			};
		}
	}

	// Blank cfg file?
	if (serverCase.trim().length === 0) {
		return {
			case: states.default
		};
	}

	// Non-custom icon
	return {
		case: {
			...states.default,
			icon: serverCase
		}
	};
};
