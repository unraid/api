import { expect, test } from 'vitest';
import { store } from '@app/store';

test('Returns paths', async () => {
	const { paths } = store.getState();
	expect(Object.keys(paths)).toMatchInlineSnapshot(`
		[
		  "core",
		  "unraid-api-base",
		  "unraid-data",
		  "docker-autostart",
		  "docker-socket",
		  "parity-checks",
		  "htpasswd",
		  "emhttpd-socket",
		  "states",
		  "dynamix-base",
		  "dynamix-config",
		  "myservers-base",
		  "myservers-config",
		  "myservers-config-states",
		  "myservers-env",
		  "keyfile-base",
		  "machine-id",
		  "log-base",
		  "var-run",
		]
	`);
});
