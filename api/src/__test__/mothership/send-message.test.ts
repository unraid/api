import { test, vi } from 'vitest';

vi.mock('@app/mothership/store', () => ({
	relayStore: {
		relay: {
			isOpened: vi.fn(),
			send: vi.fn(),
		},
	},
}));

test.each([
	{ name: 'ka-test', type: 'ka' },
	{ name: 'error-test', type: 'error', id: 'my-id', payload: { error: { 'test-error': 'this-is-unknown' } } },
	{ name: 'data-test', type: 'data', id: 'my-id', payload: { data: { 'test-data': 'this-is-unknown-data' } } },
	{ name: 'data-test', type: 'whatever', id: 'my-id', payload: { 'test-data': 'this-is-unknown-data-for-whatever' } },
])('SendMessage types', async input => {
	const { relayStore } = await import('@app/mothership/store');
	relayStore.relay!.isOpened = false;
	const { sendMessage } = await import('@app/mothership/send-message');

	// Onst importedFile = await import('@app/mothership/index');

	// @TODO: Add some expects here, probably requires a refactor to mock better

	// @ts-expect-error This is untyped input
	sendMessage(...Object.values(input));
});
