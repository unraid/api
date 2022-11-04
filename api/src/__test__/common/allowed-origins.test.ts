import { expect, test } from 'vitest';

// Preloading imports for faster tests
import '@app/common/allowed-origins';
import '@app/store/modules/emhttp';
import '@app/store';

test('Returns allowed origins', async () => {
	const { store } = await import('@app/store');
	const { loadStateFiles } = await import('@app/store/modules/emhttp');
	const { getAllowedOrigins } = await import('@app/common/allowed-origins');

	// Load state files into store
	await store.dispatch(loadStateFiles());

	// Get allowed origins
	expect(getAllowedOrigins()).toMatchInlineSnapshot(`
		[
		  "http://localhost",
		  "http://192.168.1.150",
		  "https://192.168.1.150",
		  "http://tower",
		  "https://tower",
		  "http://tower.local",
		  "https://tower.local",
		  "https://192-168-1-150.thisisfourtyrandomcharacters012345678900.myunraid.net",
		  "/var/run/unraid-notifications.sock",
		  "/var/run/unraid-php.sock",
		  "/var/run/unraid-cli.sock",
		]
	`);
});
