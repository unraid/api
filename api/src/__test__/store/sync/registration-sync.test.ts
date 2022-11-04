import { test, expect, vi } from 'vitest';

// Preloading imports for faster tests
import '@app/store/sync/array-sync';

vi.mock('@app/core/pubsub', () => ({
	pubsub: { publish: vi.fn() },
}));

test('Creates a registration event', async () => {
	const { createRegistrationEvent } = await import('@app/store/sync/registration-sync');
	const { store } = await import('@app/store');
	const { loadStateFiles } = await import('@app/store/modules/emhttp');

	// Load state files into store
	await store.dispatch(loadStateFiles());

	const state = store.getState();
	const registrationEvent = createRegistrationEvent(state);
	expect(registrationEvent).toMatchInlineSnapshot(`
		{
		  "registration": {
		    "guid": "13FE-4200-C300-58C372A52B19",
		    "keyFile": {
		      "contents": null,
		      "location": "/app/dev/Unraid.net/Pro.key",
		    },
		    "state": "PRO",
		    "type": "PRO",
		  },
		}
	`);
});
