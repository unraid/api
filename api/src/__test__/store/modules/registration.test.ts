import { test, expect } from 'vitest';
import { store } from '@app/store';
import { FileLoadStatus } from '@app/store/types';

// Preloading imports for faster tests
import '@app/store/modules/registration';
import '@app/store/modules/emhttp';

test('Before loading key returns null', async () => {
	const { status, keyFile } = store.getState().registration;
	expect(status).toBe(FileLoadStatus.UNLOADED);
	expect(keyFile).toBe(null);
});

test('Requires emhttp to be loaded to find key file', async () => {
	const { loadRegistrationKey } = await import('@app/store/modules/registration');

	// Load registration key into store
	await store.dispatch(loadRegistrationKey());

	// Check if store has state files loaded
	const { status, keyFile } = store.getState().registration;
	expect(status).toBe(FileLoadStatus.LOADED);
	expect(keyFile).toBe(null);
});

test('Returns empty key if key location is empty', async () => {
	const { updateEmhttpState } = await import('@app/store/modules/emhttp');
	const { loadRegistrationKey } = await import('@app/store/modules/registration');

	// Set key file location as empty
	// This should only happen if the user doesn't have a key file
	store.dispatch(updateEmhttpState({
		field: 'var',
		state: {
			regFile: '',
		},
	}));

	// Load registration key into store
	await store.dispatch(loadRegistrationKey());

	// Check if store has state files loaded
	const { status, keyFile } = store.getState().registration;
	expect(status).toBe(FileLoadStatus.LOADED);
	expect(keyFile).toBe('');
});

test('Returns decoded key file if key location exists', async () => {
	const { loadRegistrationKey } = await import('@app/store/modules/registration');
	const { loadStateFiles } = await import('@app/store/modules/emhttp');

	// Load state files into store
	await store.dispatch(loadStateFiles());

	// Load registration key into store
	await store.dispatch(loadRegistrationKey());

	// Check if store has state files loaded
	const { status, keyFile } = store.getState().registration;
	expect(status).toBe(FileLoadStatus.LOADED);
	expect(keyFile).toMatchInlineSnapshot('"hVs1tLjvC9FiiQsIwIQ7G1KszAcexf0IneThhnmf22SB0dGs5WzRkqMiSMmt2DtR5HOXFUD32YyxuzGeUXmky3zKpSu6xhZNKVg5atGM1OfvkzHBMldI3SeBLuUFSgejLbpNUMdTrbk64JJdbzle4O8wiQgkIpAMIGxeYLwLBD4zHBcfyzq40QnxG--HcX6j25eE0xqa2zWj-j0b0rCAXahJV2a3ySCbPzr1MvfPRTVb0rr7KJ-25R592hYrz4H7Sc1B3p0lr6QUxHE6o7bcYrWKDRtIVoZ8SMPpd1_0gzYIcl5GsDFzFumTXUh8NEnl0Q8hwW1YE-tRc6Y_rrvd7w"');
});
