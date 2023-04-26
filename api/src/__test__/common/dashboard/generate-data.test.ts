import { expect, test, vi } from 'vitest';
import { store } from '@app/store';

import { loadStateFiles } from '@app/store/modules/emhttp';

vi.mock('@vmngr/libvirt', () => ({
	ConnectListAllDomainsFlags: {
		ACTIVE: 0,
		INACTIVE: 1,
	},
}));

vi.mock('@app/core/log', () => ({
	logger: {
		info: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
		trace: vi.fn(),
		addContext: vi.fn(),
		removeContext: vi.fn(),
	},
	dashboardLogger: {
		info: vi.fn(),
		error: vi.fn((...input) => console.log(input)),
		debug: vi.fn(),
		trace: vi.fn(),
		addContext: vi.fn(),
		removeContext: vi.fn(),
	},
	emhttpLogger: {
		info: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
		trace: vi.fn(),
		addContext: vi.fn(),
		removeContext: vi.fn(),
	},
}));

vi.mock('@app/common/two-factor', () => ({
	checkTwoFactorEnabled: vi.fn(() => ({
		isRemoteEnabled: false,
		isLocalEnabled: false,
	})),
}));

vi.mock('@app/common/dashboard/boot-timestamp', () => ({
	bootTimestamp: new Date('2022-06-10T04:35:58.276Z'),
}));

test('Returns generated data', async () => {
	await store.dispatch(loadStateFiles()).unwrap();

	const { generateData } = await import('@app/common/dashboard/generate-data');
	const result = await generateData();

	expect(result).toMatchInlineSnapshot(`
		{
		  "apps": {
		    "installed": 0,
		    "started": 0,
		  },
		  "array": {
		    "capacity": {
		      "bytes": {
		        "free": 19495825571000,
		        "total": 41994745901000,
		        "used": 22498920330000,
		      },
		    },
		    "state": "STOPPED",
		  },
		  "config": {
		    "valid": true,
		  },
		  "display": {
		    "case": {
		      "base64": "",
		      "error": "",
		      "icon": "case-model.png",
		      "url": "",
		    },
		  },
		  "os": {
		    "hostname": "Tower",
		    "uptime": 2022-06-10T04:35:58.276Z,
		  },
		  "services": [
		    {
		      "name": "unraid-api",
		      "online": true,
		      "uptime": {
		        "timestamp": 2022-06-10T04:35:58.276Z,
		      },
		      "version": "THIS_WILL_BE_REPLACED_WHEN_BUILT",
		    },
		    {
		      "name": "dynamic-remote-access",
		      "online": false,
		      "uptime": {
		        "timestamp": 2022-06-10T04:35:58.276Z,
		      },
		      "version": "DISABLED",
		    },
		  ],
		  "vars": {
		    "flashGuid": "0000-0000-0000-000000000000",
		    "regState": "PRO",
		    "regTy": "PRO",
		  },
		  "versions": {
		    "unraid": "6.11.2",
		  },
		  "vms": {
		    "installed": 0,
		    "started": 0,
		  },
		}
	`);
}, 10_000);
