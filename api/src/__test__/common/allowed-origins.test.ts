import { expect, test } from 'vitest';

// Preloading imports for faster tests
import '@app/common/allowed-origins';
import '@app/store/modules/emhttp';
import '@app/store';

test('Returns allowed origins', async () => {
	const { store } = await import('@app/store');
	const { loadStateFiles } = await import('@app/store/modules/emhttp');
	const { getAllowedOrigins } = await import('@app/common/allowed-origins');
	const { loadConfigFile } = await import('@app/store/modules/config');

	// Load state files into store
	await store.dispatch(loadStateFiles());
	await store.dispatch(loadConfigFile());

	// Get allowed origins
	expect(getAllowedOrigins()).toMatchInlineSnapshot(`
		[
		  "/var/run/unraid-notifications.sock",
		  "/var/run/unraid-php.sock",
		  "/var/run/unraid-cli.sock",
		  "http://localhost:8080",
		  "https://localhost:4443",
		  "https://tower.local:4443",
		  "https://192.168.1.150:4443",
		  "https://tower:4443",
		  "https://192-168-1-150.thisisfourtyrandomcharacters012345678900.myunraid.net:4443",
		  "https://85-121-123-122.thisisfourtyrandomcharacters012345678900.myunraid.net:8443",
		  "https://10-252-0-1.hash.myunraid.net:4443",
		  "https://10-252-1-1.hash.myunraid.net:4443",
		  "https://10-253-3-1.hash.myunraid.net:4443",
		  "https://10-253-4-1.hash.myunraid.net:4443",
		  "https://10-253-5-1.hash.myunraid.net:4443",
		  "https://connect.myunraid.net",
		  "https://staging.connect.myunraid.net",
		  "https://dev-my.myunraid.net:4000",
		]
	`);
});
