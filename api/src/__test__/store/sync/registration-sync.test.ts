import { expect, test, vi } from 'vitest';

import { store } from '@app/store/index.js';
import { loadStateFiles } from '@app/store/modules/emhttp.js';
import { createRegistrationEvent } from '@app/store/sync/registration-sync.js';

vi.mock('@app/core/pubsub', () => ({
    pubsub: { publish: vi.fn() },
}));

test('Creates a registration event', async () => {
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
