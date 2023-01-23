import { KEYSERVER_VALIDATION_ENDPOINT } from '@app/consts';
import { keyServerLogger as ksLog } from '@app/core/log';
import { sendFormToKeyServer } from '@app/core/utils/misc/send-form-to-keyserver';
import { API_KEY_STATUS } from '@app/mothership/api-key/api-key-types';
import { type Response } from 'got';

/**
 * Perform a web validation of the API Key
 * @param state
 * @returns
 */
export const validateApiKeyWithKeyServer = async ({ flashGuid, apiKey }: { flashGuid: string; apiKey: string }): Promise<API_KEY_STATUS> => {
	// If we're still loading config state, just return the config is loading

	ksLog.log('Validating API Key with KeyServer');

	// Send apiKey, etc. to key-server for verification
	let response: Response<string>;
	try {
		response = await sendFormToKeyServer(KEYSERVER_VALIDATION_ENDPOINT, {
			guid: flashGuid,
			apikey: apiKey,
		});
	} catch (error: unknown) {
		ksLog.addContext('networkError', error);
		ksLog.error('Caught error reaching Key Server');
		ksLog.removeContext('networkError');

		return API_KEY_STATUS.NETWORK_ERROR;
	}

	ksLog.trace('Got response back from key-server while validating API key');

	if (response.statusCode !== 200) {
		ksLog.warn('Error while validating API key with key-server', response);
		return API_KEY_STATUS.INVALID_KEYSERVER_RESPONSE;
	}

	// Get response data
	let data: { valid: boolean };
	try {
		data = JSON.parse(response.body);
	} catch (error: unknown) {
		ksLog.warn('Failed to parse Keyserver response body', error);
		return API_KEY_STATUS.INVALID_KEYSERVER_RESPONSE;
	}

	const { valid } = data;

	if (typeof valid === 'boolean') {
		if (valid) {
			return API_KEY_STATUS.API_KEY_VALID;
		}

		return API_KEY_STATUS.API_KEY_INVALID;
	}

	ksLog.warn('Returned data from keyserver appears to be invalid', data);
	return API_KEY_STATUS.INVALID_KEYSERVER_RESPONSE;
};
