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
		  "/var/run/unraid-notifications.sock",
		  "/var/run/unraid-php.sock",
		  "/var/run/unraid-cli.sock",
		  "http://localhost:8080/",
		  "https://localhost:4443/",
		  "https://tower.local:4443/",
		  "https://192.168.1.150:4443/",
		  "https://tower:4443/",
		  "https://192-168-1-150.thisisfourtyrandomcharacters012345678900.myunraid.net:4443/",
		  "https://85-121-123-122.thisisfourtyrandomcharacters012345678900.myunraid.net:4443/",
		]
	`);
});
