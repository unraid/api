import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { getters } from '@app/store';

const states = {
	// Success
	custom: {
		url: '',
		icon: 'custom',
		error: '',
		base64: '',
	},
	default: {
		url: '',
		icon: 'default',
		error: '',
		base64: '',
	},

	// Errors
	couldNotReadConfigFile: {
		url: '',
		icon: 'custom',
		error: 'could-not-read-config-file',
		base64: '',
	},
	couldNotReadImage: {
		url: '',
		icon: 'custom',
		error: 'could-not-read-image',
		base64: '',
	},
	imageMissing: {
		url: '',
		icon: 'custom',
		error: 'image-missing',
		base64: '',
	},
	imageTooBig: {
		url: '',
		icon: 'custom',
		error: 'image-too-big',
		base64: '',
	},
	imageCorrupt: {
		url: '',
		icon: 'custom',
		error: 'image-corrupt',
		base64: '',
	},
};

export default async () => {
	const dynamixBasePath = getters.paths()['dynamix-base'];
	const configFilePath = join(dynamixBasePath, 'case-model.cfg');

	// If the config file doesn't exist then it's a new OS install
	// Default to "default"
	if (!existsSync(configFilePath)) {
		return { case: states.default };
	}

	// Attempt to get case from file
	const serverCase = await readFile(configFilePath)
		.then(buffer => buffer.toString().split('\n')[0])
		.catch(() => 'error_reading_config_file');

	// Config file can't be read, maybe a permissions issue?
	if (serverCase === 'error_reading_config_file') {
		return { case: states.couldNotReadConfigFile };
	}

	// Blank cfg file?
	if (serverCase.trim().length === 0) {
		return {
			case: states.default,
		};
	}

	// Non-custom icon
	return {
		case: {
			...states.default,
			icon: serverCase,
		},
	};
};

/* Custom Icon Logic (To Return Later) */

/*
	const customImageFilePath = join(dynamixBasePath, 'case-model.png');

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
			const fileBuffer = await readFile(customImageFilePath);

			// Likely not an actual image
			// 73 bytes is close to the smallest we can get https://garethrees.org/2007/11/14/pngcrush/
			if (fileBuffer.length <= 25) {
				return {
					case: states.couldNotReadImage,
				};
			}

			return {
				case: {
					...states.custom,
					base64: fileBuffer.toString('base64'),
					url: serverCase,
				},
			};
		} catch (error: unknown) {
			return {
				case: states.couldNotReadImage,
			};
		}
	}

	*/
