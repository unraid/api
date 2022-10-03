import { beforeEach, describe, expect, test, vi } from 'vitest';
import { logger } from '@app/core/log';
import { clearValidKeyCache, validateApiKey } from '@app/core/utils/misc/validate-api-key';
import * as keyserverValidation from '@app/core/utils/misc/send-form-to-keyserver';
import * as appStore from '@app/store';

vi.mock('@app/core/log', () => ({
	logger: {
		addContext: vi.fn(),
		removeContext: vi.fn(),
		info: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
		trace: vi.fn(),
	},
	graphqlLogger: {
		addContext: vi.fn(),
		removeContext: vi.fn(),
		info: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
		trace: vi.fn(),
	},
}));

describe('tests without key cache', () => {
	beforeEach(() => {
		clearValidKeyCache();
	});

	test('Returns false when API key is invalid', async () => {
		await expect(validateApiKey('this-is-an-invalid-api-key', false)).resolves.toBe(false);
	});

	test('validates a valid key successfully', async () => {
		const mockedFormResponse = vi.fn().mockResolvedValue({ body: '{ "valid": true }', statusCode: 200 });
		vi.spyOn(keyserverValidation, 'sendFormToKeyServer').mockImplementation(mockedFormResponse);
		// @ts-expect-error This is a partial mock
		vi.spyOn(appStore.getters, 'emhttp').mockImplementation(vi.fn(() => ({ var: { flashGuid: 'my-flash-guid' } })));
		vi.spyOn(appStore.store, 'dispatch');
		await expect(validateApiKey('this-api-key-is-valid-because-of-spy')).resolves.toBe(true);
		expect(vi.mocked(keyserverValidation.sendFormToKeyServer)).toHaveBeenCalledWith('https://keys.lime-technology.com/validate/apikey', {
			guid: 'my-flash-guid',
			apikey: 'this-api-key-is-valid-because-of-spy',
		});
		expect(vi.mocked(appStore.store.dispatch)).not.toHaveBeenCalled();
	});

	test('validates an valid key with an error', async () => {
		const mockedFormResponse = vi.fn().mockResolvedValue({ body: '{ "valid": false }', statusCode: 200 });
		vi.spyOn(keyserverValidation, 'sendFormToKeyServer').mockImplementation(mockedFormResponse);
		// @ts-expect-error This is a partial mock
		vi.spyOn(appStore.getters, 'emhttp').mockImplementation(vi.fn(() => ({ var: { flashGuid: 'my-flash-guid' } })));
		vi.spyOn(appStore.store, 'dispatch');

		await expect(validateApiKey('this-api-key-is-valid-because-of-spy')).rejects.toThrowErrorMatchingInlineSnapshot('"Invalid API key"');
		expect(vi.mocked(keyserverValidation.sendFormToKeyServer)).toHaveBeenCalledWith('https://keys.lime-technology.com/validate/apikey', {
			guid: 'my-flash-guid',
			apikey: 'this-api-key-is-valid-because-of-spy',
		});

		expect(vi.mocked(appStore.store.dispatch)).toHaveBeenCalledTimes(2);
	});

	test('when guid is not found, rejects', async () => {
		// @ts-expect-error This is a partial mock
		vi.spyOn(appStore.getters, 'emhttp').mockImplementation(vi.fn(() => ({ var: { flashGuid: undefined } })));
		vi.spyOn(appStore.store, 'dispatch');
		await expect(validateApiKey('this-api-key-is-valid-because-of-spy')).rejects.toThrowErrorMatchingInlineSnapshot('"Missing API key or flashGuid"');
		expect(vi.mocked(appStore.store.dispatch)).not.toHaveBeenCalled();

		await expect(validateApiKey('this-api-key-is-valid-because-of-spy', false)).resolves.toBe(false);
		expect(vi.mocked(appStore.store.dispatch)).not.toHaveBeenCalled();
	});

	test('when api key not found, rejects', async () => {
		// @ts-expect-error This is a partial mock
		vi.spyOn(appStore.getters, 'emhttp').mockImplementation(vi.fn(() => ({ var: { flashGuid: 'my-flash-guid' } })));
		// @ts-expect-error Invalid arguments
		await expect(validateApiKey(undefined)).rejects.toThrowErrorMatchingInlineSnapshot('"Missing API key or flashGuid"');
		// @ts-expect-error Invalid arguments
		await expect(validateApiKey(undefined, false)).resolves.toBe(false);
	});

	test('when body is not parseable, rejects', async () => {
		const mockedFormResponse = vi.fn().mockResolvedValue({ body: '{ thisIsInvalidJson }', statusCode: 200 });
		vi.spyOn(keyserverValidation, 'sendFormToKeyServer').mockImplementation(mockedFormResponse);
		// @ts-expect-error This is a partial mock
		vi.spyOn(appStore.getters, 'emhttp').mockImplementation(vi.fn(() => ({ var: { flashGuid: 'my-flash-guid' } })));
		await expect(validateApiKey('this-api-key-is-valid-because-of-spy')).rejects.toThrowErrorMatchingInlineSnapshot('"Could not parse JSON response from API Key Validation"');

		expect(vi.mocked(keyserverValidation.sendFormToKeyServer)).toHaveBeenCalledWith('https://keys.lime-technology.com/validate/apikey', {
			guid: 'my-flash-guid',
			apikey: 'this-api-key-is-valid-because-of-spy',
		});

		await expect(validateApiKey('this-api-key-is-valid-because-of-spy', false)).resolves.toBe(false);
	});

	test('when mocked api response throws an error, rejects', async () => {
		const mockedErrorResponse = vi.fn().mockRejectedValue(new Error('Sending API Key to Server Failed'));
		vi.spyOn(keyserverValidation, 'sendFormToKeyServer').mockImplementation(mockedErrorResponse);
		// @ts-expect-error This is a partial mock
		vi.spyOn(appStore.getters, 'emhttp').mockImplementation(vi.fn(() => ({ var: { flashGuid: 'my-flash-guid' } })));

		await expect(validateApiKey('this-api-key-is-valid-because-of-spy')).rejects.toThrowErrorMatchingInlineSnapshot('"Sending API Key to Server Failed"');

		expect(logger.error).toHaveBeenCalledWith('Caught error reaching Key Server');
		await expect(validateApiKey('this-api-key-is-valid-because-of-spy', false)).resolves.toBe(false);
	});
});

test('validates a valid key successfully, then uses key-cache to retrieve next key', async () => {
	const mockedFormResponse = vi.fn().mockResolvedValue({ body: '{ "valid": true }', statusCode: 200 });
	vi.spyOn(keyserverValidation, 'sendFormToKeyServer').mockImplementation(mockedFormResponse);
	// @ts-expect-error This is a partial mock
	vi.spyOn(appStore.getters, 'emhttp').mockImplementation(vi.fn(() => ({ var: { flashGuid: 'my-flash-guid' } })));
	await expect(validateApiKey('this-api-key-is-valid-because-of-spy')).resolves.toBe(true);
	expect(vi.mocked(keyserverValidation.sendFormToKeyServer)).toHaveBeenCalledWith('https://keys.lime-technology.com/validate/apikey', {
		guid: 'my-flash-guid',
		apikey: 'this-api-key-is-valid-because-of-spy',
	});
	expect(vi.mocked(keyserverValidation.sendFormToKeyServer)).toHaveBeenCalledOnce();

	// Next time we will throw an error, but this will still validate because the key is stored inside of the set
	const mockedErrorResponse = vi.fn().mockRejectedValue(new Error('Sending API Key to Server Failed'));
	vi.spyOn(keyserverValidation, 'sendFormToKeyServer').mockImplementation(mockedErrorResponse);
	await expect(validateApiKey('this-api-key-is-valid-because-of-spy')).resolves.toBe(true);
	expect(vi.mocked(keyserverValidation.sendFormToKeyServer)).not.toHaveBeenCalled();
});
