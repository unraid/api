import { ApiKeyError } from '../../errors';

export const validateApiKeyFormat = (apiKey: string | undefined, shouldThrow = true) => {
	const key = (apiKey ?? '').trim();
	const length = key.length;

	// Bail if key is missing
	if (length === 0) {
		if (shouldThrow) throw new ApiKeyError(`Key is empty, ${length}/64`);
		return false;
	}

	// Bail if the key is too short
	// For example "123456789"
	if (length < 64) {
		if (shouldThrow) throw new ApiKeyError(`Key is too short, ${length}/64`);
		return false;
	}

	// Bail if the key is too long
	// For example "************************************************************************************************************************************"
	if (length > 64) {
		if (shouldThrow) throw new ApiKeyError(`Key is too long, ${length}/64`);
		return false;
	}

	// Bail if the key is the same char repeated
	// For example "XXXXXXXXXXXXXXXXXXX"
	if (/^(.)\1+$/.test(key)) {
		if (shouldThrow) throw new ApiKeyError(`Key is same char repeated, ${key}`);
		return false;
	}

	return true;
};
