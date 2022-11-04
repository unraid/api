import { join } from 'path';
import { expect, test } from 'vitest';
import { store } from '@app/store';
import type { NetworkIni } from '@app/store/state-parsers/network';

test('Returns parsed state file', async () => {
	const { parse } = await import('@app/store/state-parsers/network');
	const { parseConfig } = await import('@app/core/utils/misc/parse-config');
	const { paths } = store.getState();
	const filePath = join(paths.states, 'network.ini');
	const stateFile = parseConfig<NetworkIni>({
		filePath,
		type: 'ini',
	});
	expect(parse(stateFile)).toMatchInlineSnapshot(`
		[
		  {
		    "bonding": true,
		    "bondingMiimon": "100",
		    "bondingMode": "1",
		    "bondname": "",
		    "bondnics": [
		      "eth0",
		      "eth1",
		      "eth2",
		      "eth3",
		    ],
		    "brfd": "0",
		    "bridging": true,
		    "brname": "",
		    "brnics": "bond0",
		    "brstp": "0",
		    "description": [
		      "",
		    ],
		    "dhcp6Keepresolv": false,
		    "dhcpKeepresolv": false,
		    "dnsServer1": "1.1.1.1",
		    "dnsServer2": "8.8.8.8",
		    "gateway": [
		      "192.168.1.1",
		    ],
		    "gateway6": [
		      "",
		    ],
		    "ipaddr": [
		      "192.168.1.150",
		    ],
		    "ipaddr6": [
		      "",
		    ],
		    "metric": [
		      "",
		    ],
		    "metric6": [
		      "",
		    ],
		    "mtu": "",
		    "netmask": [
		      "255.255.255.0",
		    ],
		    "netmask6": [
		      "",
		    ],
		    "privacy6": [
		      "",
		    ],
		    "protocol": [
		      "",
		    ],
		    "type": "access",
		    "useDhcp": [
		      true,
		    ],
		    "useDhcp6": [
		      false,
		    ],
		  },
		]
	`);
});
