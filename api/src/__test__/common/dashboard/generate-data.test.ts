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
}));

vi.mock('@app/common/dashboard/get-array', () => ({
	getArray: vi.fn(),
}));

vi.mock('@app/common/two-factor', () => ({
	checkTwoFactorEnabled: vi.fn(() => ({
		isRemoteEnabled: false,
		isLocalEnabled: false,
	})),
}));

vi.mock('@app/common/dashboard/get-unraid-version', () => ({
	getUnraidVersion: vi.fn(() => '6.0.0'),
}));

vi.mock('@app/graphql/resolvers/query/display', () => ({
	default: vi.fn().mockResolvedValue({
		case: {
			url: '',
			icon: 'custom',
			error: 'could-not-read-image',
			base64: '',
		},
	}),
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
		  "array": undefined,
		  "config": {
		    "valid": true,
		  },
		  "display": {
		    "case": {
		      "base64": "",
		      "error": "could-not-read-image",
		      "icon": "custom",
		      "url": "",
		    },
		  },
		  "os": {
		    "hostname": "Tower",
		    "uptime": "2022-06-10T04:35:58.276Z",
		  },
		  "services": [
		    {
		      "name": "unraid-api",
		      "online": true,
		      "uptime": {
		        "timestamp": "2022-06-10T04:35:58.276Z",
		      },
		      "version": "THIS_WILL_BE_REPLACED_WHEN_BUILT",
		    },
		  ],
		  "twoFactor": {
		    "local": {
		      "enabled": false,
		    },
		    "remote": {
		      "enabled": false,
		    },
		  },
		  "vars": {
		    "flashGuid": "0000-0000-0000-000000000000",
		    "regState": "PRO",
		    "regTy": "PRO",
		  },
		  "versions": {
		    "unraid": "6.0.0",
		  },
		  "vms": {
		    "installed": 0,
		    "started": 0,
		  },
		}
	`);
}, 10_000);
