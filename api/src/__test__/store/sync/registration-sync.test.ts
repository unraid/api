import { expect, test, vi } from 'vitest';

import { store } from '@app/store/index.js';
import { loadStateFiles } from '@app/store/modules/emhttp.js';
import { loadRegistrationKey } from '@app/store/modules/registration.js';
import { createRegistrationEvent } from '@app/store/sync/registration-sync.js';

vi.mock('@app/core/pubsub', () => ({
    pubsub: { publish: vi.fn() },
}));

test('Creates a registration event', async () => {
    // Load state files into store

    const config = await store.dispatch(loadStateFiles()).unwrap();
    await store.dispatch(loadRegistrationKey());
    expect(config.var.regFile).toBe('/app/dev/Unraid.net/Pro.key');

    const state = store.getState();
    const registrationEvent = createRegistrationEvent(state);
    expect(registrationEvent).toMatchInlineSnapshot(`
		{
		  "registration": {
		    "guid": "13FE-4200-C300-58C372A52B19",
		    "keyFile": {
		      "contents": "hVs1tLjvC9FiiQsIwIQ7G1KszAcexf0IneThhnmf22SB0dGs5WzRkqMiSMmt2DtR5HOXFUD32YyxuzGeUXmky3zKpSu6xhZNKVg5atGM1OfvkzHBMldI3SeBLuUFSgejLbpNUMdTrbk64JJdbzle4O8wiQgkIpAMIGxeYLwLBD4zHBcfyzq40QnxG--HcX6j25eE0xqa2zWj-j0b0rCAXahJV2a3ySCbPzr1MvfPRTVb0rr7KJ-25R592hYrz4H7Sc1B3p0lr6QUxHE6o7bcYrWKDRtIVoZ8SMPpd1_0gzYIcl5GsDFzFumTXUh8NEnl0Q8hwW1YE-tRc6Y_rrvd7w",
		      "location": "/app/dev/Unraid.net/Pro.key",
		    },
		    "state": "PRO",
		    "type": "PRO",
		  },
		}
	`);
});
