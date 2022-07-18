import { checkRelay } from '@app/graphql/resolvers/query/cloud/check-relay';
import { expect, test, vi } from 'vitest';

test('Defaults', async () => {
	const { relayStore } = await import('@app/mothership/store');
	relayStore.code = undefined;
	relayStore.reason = undefined;
	relayStore.relay = undefined;
	relayStore.timeout = undefined;
	expect(checkRelay()).toStrictEqual({
		error: '',
		status: 'disconnected',
		timeout: 0
	});
});

test('Reconnecting', async () => {
	const { relayStore } = await import('@app/mothership/store');
	relayStore.code = 12;
	relayStore.reason = 'SERVICE_RESTART';
	relayStore.relay = undefined;
	relayStore.timeout = Date.now() + 60_000;
	expect(checkRelay()).toStrictEqual({
		error: 'SERVICE_RESTART',
		status: 'disconnected',
		timeout: 60_000
	});
});
