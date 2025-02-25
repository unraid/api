import { expect, test, vi } from 'vitest';

vi.mock('@app/core/pubsub', () => ({
    pubsub: { publish: vi.fn() },
}));

test('Creates a registration event', async () => {
    const { createRegistrationEvent } = await import('@app/store/sync/registration-sync.js');
    const { store } = await import('@app/store/index.js');
    const { loadStateFiles } = await import('@app/store/modules/emhttp.js');

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
