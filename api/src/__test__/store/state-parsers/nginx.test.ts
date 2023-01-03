import { join } from 'path';
import { expect, test } from 'vitest';
import { store } from '@app/store';
import type { NginxIni } from '@app/store/state-parsers/nginx';

test('Returns parsed state file', async () => {
	const { parse } = await import('@app/store/state-parsers/nginx');
	const { parseConfig } = await import('@app/core/utils/misc/parse-config');
	const { paths } = store.getState();
	const filePath = join(paths.states, 'nginx.ini');
	const stateFile = parseConfig<NginxIni>({
		filePath,
		type: 'ini',
	});
	expect(parse(stateFile)).toMatchInlineSnapshot(`
		{
		  "certificateName": "*.thisisfourtyrandomcharacters012345678900.myunraid.net",
		  "certificatePath": "/boot/config/ssl/certs/certificate_bundle.pem",
		  "defaultUrl": "https://Tower.local:4443",
		  "httpPort": 8080,
		  "httpsPort": 4443,
		  "lanFqdn": "192-168-1-150.thisisfourtyrandomcharacters012345678900.myunraid.net",
		  "lanFqdn6": "",
		  "lanIp": "192.168.1.150",
		  "lanIp6": "",
		  "lanMdns": "Tower.local",
		  "lanName": "Tower",
		  "sslEnabled": true,
		  "sslMode": "yes",
		  "wanAccessEnabled": false,
		  "wanFqdn": "85-121-123-122.thisisfourtyrandomcharacters012345678900.myunraid.net",
		  "wanFqdn6": "",
		  "wanIp": "",
		}
	`);
});
