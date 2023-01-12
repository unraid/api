/**
 * Check is the API Key is the correct length (64 characters)
 * @param apiKey API Key to validate length
 * @returns Boolean
 */
export const isApiKeyCorrectLength = (apiKey: string) => {
	if (apiKey.length !== 64) {
		return false;
	}

	return true;
};
