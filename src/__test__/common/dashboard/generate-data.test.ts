import { expect, test, vi } from 'vitest';
import { generateData } from '../../../common/dashboard/generate-data';

vi.mock('@vmngr/libvirt', () => ({
	ConnectListAllDomainsFlags: {
		ACTIVE: 0,
		INACTIVE: 1
	}
}));

vi.mock('../../../core/log', () => ({
	logger: {
		info: vi.fn(),
		error: vi.fn(),
		debug: vi.fn()
	}
}));

vi.mock('../../../core/states/var', () => ({
	varState: {
		data: {
			flashGuid: '123-123-123-123',
			mdState: 'STARTED'
		}
	}
}));

vi.mock('../../../common/dashboard/get-array', () => ({
	getArray: vi.fn()
}));

vi.mock('../../../common/two-factor', () => ({
	checkTwoFactorEnabled: vi.fn(() => ({
		isRemoteEnabled: false,
		isLocalEnabled: false
	}))
}));

vi.mock('../../../common/dashboard/get-unraid-version', () => ({
	getUnraidVersion: vi.fn(() => '6.0.0')
}));

vi.mock('../../../graphql/resolvers/query/display', () => ({
	default: vi.fn().mockResolvedValue({})
}));

vi.mock('../../../common/dashboard/boot-timestamp', () => ({
	bootTimestamp: new Date('2022-06-10T04:35:58.276Z')
}));

test('Returns generated data', async () => {
	const result = await generateData();

	expect(result).toMatchInlineSnapshot(`
		{
		  "apps": {
		    "installed": 0,
		    "started": 0,
		  },
		  "array": undefined,
		  "config": {
		    "error": "UNKNOWN_ERROR",
		    "valid": undefined,
		  },
		  "display": {},
		  "os": {
		    "hostname": undefined,
		    "uptime": 2022-06-10T04:35:58.276Z,
		  },
		  "services": [
		    {
		      "name": "unraid-api",
		      "online": true,
		      "uptime": {
		        "timestamp": "2022-06-10T04:35:58.276Z",
		      },
		      "version": "2.47.1",
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
		    "flashGuid": "123-123-123-123",
		    "regState": undefined,
		    "regTy": undefined,
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
});
