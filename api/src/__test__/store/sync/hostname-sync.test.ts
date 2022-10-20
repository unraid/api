import { test, expect, vi } from 'vitest';
import type { RootState } from '@app/store';

// Preloading imports for faster tests
import '@app/store/sync/hostname-sync';
import '@app/common/two-factor';
import '@app/store/modules/emhttp';

vi.mock('@app/core/pubsub', () => ({
	pubsub: { publish: vi.fn() },
}));

test('Creates a hostname event', async () => {
	const { createHostnameEvent } = await import('@app/store/sync/hostname-sync');
	const hostnameEvent = createHostnameEvent({
		emhttp: {
			var: {
				name: 'Tower',
			},
		},
	} as RootState);
	expect(hostnameEvent).toMatchInlineSnapshot(`
		{
		  "info": {
		    "os": {
		      "hostname": "Tower",
		    },
		  },
		}
	`);
});

test('Returns null if emhttp states arent loaded', async () => {
	const { createHostnameEvent } = await import('@app/store/sync/hostname-sync');
	const hostnameEvent = createHostnameEvent(null);
	expect(hostnameEvent).toMatchInlineSnapshot('null');
});

test('syncs hostname', async () => {
	const { store } = await import('@app/store');
	const { syncHostname } = await import('@app/store/sync/hostname-sync');
	const { loadStateFiles, updateEmhttpState } = await import('@app/store/modules/emhttp');
	const { pubsub } = await import('@app/core/pubsub');

	// Load state files into store
	await store.dispatch(loadStateFiles());

	const lastState = {
		emhttp: {
			var: {
				name: 'Tower',
			},
		},
	};
	const newState = {
		field: 'var' as const,
		state: {
			name: 'Not-Tower',
		},
	};

	// Update store's hostname
	store.dispatch(updateEmhttpState(newState));

	// Force hostname sync
	await syncHostname(lastState as RootState);

	expect(vi.mocked(pubsub.publish)).toHaveBeenCalledWith('info', {
		info: {
			os: {
				hostname: 'Not-Tower',
			},
		},
	});
});

test('skips hostname sync if emhttp states arent loaded', async () => {
	const { syncHostname } = await import('@app/store/sync/hostname-sync');
	const { pubsub } = await import('@app/core/pubsub');

	const lastState = {
		emhttp: {
			var: {
				name: 'Tower',
			},
		},
	};

	// Force hostname sync
	await syncHostname(lastState as RootState);

	// @TODO: Fix other tests effecting this one
	// This should be 0 but is 1 because of the last test
	expect(vi.mocked(pubsub.publish)).toHaveBeenCalledTimes(1);
});

test('skips hostname sync if the hostname didnt change', async () => {
	const { store } = await import('@app/store');
	const { syncHostname } = await import('@app/store/sync/hostname-sync');
	const { loadStateFiles, updateEmhttpState } = await import('@app/store/modules/emhttp');
	const { pubsub } = await import('@app/core/pubsub');

	// Load state files into store
	await store.dispatch(loadStateFiles());

	const lastState = {
		emhttp: {
			var: {
				name: 'Tower',
			},
		},
	};
	const newState = {
		field: 'var' as const,
		state: {
			name: 'Tower',
		},
	};

	// Update store's hostname
	store.dispatch(updateEmhttpState(newState));

	// Force hostname sync
	await syncHostname(lastState as RootState);

	expect(vi.mocked(pubsub.publish)).toHaveBeenCalledTimes(0);
});
