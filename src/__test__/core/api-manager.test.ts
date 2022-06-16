import { v4 as randomUUID } from 'uuid';
import { assert, expect, test, vi } from 'vitest';
import { ApiManager } from '@app/core/api-manager';

vi.mock('@app/core/utils/misc/load-state', () => ({
	loadState: vi.fn(() => ({
		upc: {
			apikey: '123-123-123-123-123-123'
		},
		notifier: {
			apikey: '123-123-123-123-123-123'
		}
	}))
}));

test('api manager can be instantiated', () => {
	const apiManager = new ApiManager();
	expect(apiManager).toBeTruthy();
	assert(apiManager instanceof ApiManager);
});

test('api manager is a singleton', () => {
	const apiManager = new ApiManager();
	const loggerSpy = vi.spyOn(apiManager, 'replace');
	expect(loggerSpy.mock.calls[0]).toBe(undefined);
	expect(apiManager).toBe(new ApiManager());
});

test('an API key can be replaced', () => {
	const apiKey = randomUUID();
	const apiManager = new ApiManager();
	const emitSpy = vi.spyOn(apiManager, 'emit');
	const user = {
		key: apiKey,
		name: 'random',
		userId: undefined
	};
	apiManager.replace('random', apiKey);
	expect(emitSpy.mock.calls[0]).toEqual(['add', 'random', user]);
	expect(emitSpy.mock.calls[1]).toEqual(['replace', 'random', user]);
});
