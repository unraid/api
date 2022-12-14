import { defaultAppMiddleware } from '@app/store/middleware';
import { MinigraphStatus, SubscriptionKey } from '@app/store/modules/minigraph';
import { configureStore } from '@reduxjs/toolkit';
import { test, expect, vi } from 'vitest';

vi.mock('@app/store', () => ({
	getters: { config: () => ({ version: '2.50.0' }) },
}));

// This is now in the store
vi.mock('@app/core/states', () => ({
	varState: { data: { version: '6.11.0' } },
}));

vi.mock('@app/mothership/minigraph-client', () => ({ createMinigraphClient: () => ({
	dispose: vi.fn(),
	on: vi.fn(),
	subscribe: vi.fn(),
	terminate: vi.fn(),
}) }));

test('Before init returns default values for all fields', async () => {
	const { mothership: minigraph } = await import ('@app/store/modules/minigraph');
	const store = configureStore({
		reducer: {
			minigraph: minigraph.reducer,
		},
		middleware: defaultAppMiddleware,
	});
	const state = store.getState().minigraph;
	expect(state).toMatchInlineSnapshot(`
	{
	  "client": null,
	  "error": null,
	  "status": 3,
	  "subscriptions": [],
	}
	`);
});

test.skip('setStatus works as expected', async () => {
	const { mothership: minigraph } = await import ('@app/store/modules/minigraph');
	const store = configureStore({
		reducer: {
			minigraph: minigraph.reducer,
		},
		middleware: defaultAppMiddleware,
	});
	store.dispatch(minigraph.actions.setStatus({ status: MinigraphStatus.ERROR, error: { message: 'Failed' } }));
	expect(store.getState().minigraph).toMatchInlineSnapshot(`
		{
		  "client": null,
		  "error": {
		    "message": "Failed",
		  },
		  "status": 2,
		  "subscriptions": [],
		}
	`);
	expect(store.getState().minigraph).toMatchInlineSnapshot(`
		{
		  "client": {
		    "dispose": [MockFunction spy],
		  },
		  "error": {
		    "message": "Failed",
		  },
		  "status": 2,
		  "subscriptions": [],
		}
	`);
	store.dispatch(minigraph.actions.addSubscription(SubscriptionKey.SERVERS));
	expect(store.getState().minigraph).toMatchInlineSnapshot(`
		{
		  "client": {
		    "dispose": [MockFunction spy],
		  },
		  "error": {
		    "message": "Failed",
		  },
		  "status": 2,
		  "subscriptions": [
		    {
		      "subscription": [MockFunction spy],
		      "subscriptionId": "my-sub-id",
		      "subscriptionKey": 0,
		    },
		  ],
		}
	`);

	await expect(isKeySubscribed(SubscriptionKey.SERVERS, store)).resolves.toBe(true);

	store.dispatch(minigraph.actions.removeSubscription(SubscriptionKey.SERVERS));
	expect(store.getState().minigraph).toMatchInlineSnapshot(`
		{
		  "client": {
		    "dispose": [MockFunction spy],
		  },
		  "error": {
		    "message": "Failed",
		  },
		  "status": 2,
		  "subscriptions": [],
		}
	`);
	const returnedStore = await getNewMinigraphClient(store);
	expect(returnedStore).toMatchInlineSnapshot(`
		{
		  "dispose": [MockFunction spy],
		  "on": [MockFunction spy],
		  "subscribe": [MockFunction spy],
		  "terminate": [MockFunction spy],
		}
	`);
	expect(store.getState().minigraph).toMatchInlineSnapshot(`
		{
		  "client": {
		    "dispose": [MockFunction spy],
		    "on": [MockFunction spy],
		    "subscribe": [MockFunction spy],
		    "terminate": [MockFunction spy],
		  },
		  "error": null,
		  "status": 3,
		  "subscriptions": [],
		}
	`);

	expect(store.getState()).toMatchInlineSnapshot(`
		{
		  "minigraph": {
		    "client": {
		      "dispose": [MockFunction spy],
		      "on": [MockFunction spy],
		      "subscribe": [MockFunction spy],
		      "terminate": [MockFunction spy],
		    },
		    "error": null,
		    "status": 3,
		    "subscriptions": [],
		  },
		}
	`);
	expect(store.getState().minigraph.client.dispose).not.toHaveBeenCalled();
	await expect(store.getState().minigraph.sub).resolves.toBe(false);
});
