import { ApiKeyError } from '../../errors';

export const validateApiKeyFormat = (apiKey: string) => {
    const key = `${apiKey}`.trim();
    const length = key.length;

	// Bail if key is missing
	if (length === 0) {
		throw new ApiKeyError(`Key is empty, ${length}/64`);
	}

	// Bail if the key is too short
	// For example "123456789"
	if (length < 64) {
		throw new ApiKeyError(`Key is too short, ${length}/64`);
	}

	// Bail if the key is too long
	// For example "************************************************************************************************************************************"
	if (length > 64) {
		throw new ApiKeyError(`Key is too long, ${length}/64`);
	}

	// Bail if the key is the same char repeated
	// For example "XXXXXXXXXXXXXXXXXXX"
	if (/^(.)\1+$/.test(key)) {
		throw new ApiKeyError(`Key is same char repeated, ${key}`);
    }
}
