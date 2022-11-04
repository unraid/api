import { expect, test } from 'vitest';
import { store } from '@app/store';

test('Returns paths', async () => {
	const { paths } = store.getState();
	expect(paths).toMatchInlineSnapshot(`
		{
		  "core": "/app/src/store/modules",
		  "docker-autostart": "/var/lib/docker/unraid-autostart",
		  "docker-socket": "/var/run/docker.sock",
		  "dynamix-base": "/app/dev/dynamix",
		  "dynamix-config": "/boot/config/plugins/dynamix/dynamix.cfg",
		  "emhttpd-socket": "/var/run/emhttpd.socket",
		  "htpasswd": "/etc/nginx/htpasswd",
		  "myservers-base": "/boot/config/plugins/dynamix.my.servers/",
		  "myservers-config": "/app/dev/Unraid.net/myservers.cfg",
		  "myservers-config-states": "/app/dev/states/myservers.cfg",
		  "myservers-env": "/boot/config/plugins/dynamix.my.servers/env",
		  "parity-checks": "/boot/config/parity-checks.log",
		  "states": "/app/dev/states",
		  "unraid-api-base": "/usr/local/bin/unraid-api/",
		  "unraid-data": "/app/dev/data",
		  "unraid-version": "/etc/unraid-version",
		}
	`);
});
