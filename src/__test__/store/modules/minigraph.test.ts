import { defaultAppMiddleware } from '@app/store/middleware';
import { getNewMinigraphClient, isKeySubscribed, MinigraphStatus, SubscriptionKey } from '@app/store/modules/minigraph';
import { configureStore } from '@reduxjs/toolkit';
import { Client } from 'graphql-ws';
import { test, expect, vi } from 'vitest';

vi.mock('@app/core/api-manager', () => ({
	apiManager: { cloudKey: 'hi' },
}));

vi.mock('@app/store', () => ({
	getters: { config: () => ({ version: '2.50.0' }) },
}));

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
	const { minigraph } = await import ('@app/store/modules/minigraph');
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

test('setStatus works as expected', async () => {
	const { minigraph } = await import ('@app/store/modules/minigraph');
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
	const client = { dispose: vi.fn() } as unknown as Client;
	store.dispatch(minigraph.actions.setClient(client));
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
	store.dispatch(minigraph.actions.addSubscription({ subscriptionId: 'my-sub-id', subscription: vi.fn(), subscriptionKey: SubscriptionKey.SERVERS }));
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
	expect(isKeySubscribed(SubscriptionKey.SERVERS, store)).resolves.toBe(true);

	store.dispatch(minigraph.actions.removeSubscriptionById('my-sub-id'));
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
	const clientDisposeFn = store.getState().minigraph.client.dispose;
	await getNewMinigraphClient(store);
	expect(clientDisposeFn).toHaveBeenCalledOnce();
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
	expect(isKeySubscribed(SubscriptionKey.SERVERS, store)).resolves.toBe(false);
});
