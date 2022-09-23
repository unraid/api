import { expect, test, vi } from 'vitest';
import { Var } from '@app/core/types/states';
import { cloneDeep } from '@apollo/client/utilities';
import { getters } from '@app/store';

vi.mock('fs');

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
	},
}));

vi.mock('@app/core/states/var', () => {
	const data = {
		flashGuid: '123-123-123-123',
		mdState: 'STARTED',
		regState: 'PRO',
		regTy: 'PRO',
		name: 'Tower',
		configValid: true,
	};

	const varState: {
		_source: 'nchan' | 'file';
		_data: Partial<Var>;
		data: Partial<Var>;
		switchSource: any;
	} = {
		_source: 'nchan',
		_data: cloneDeep(data) as unknown as Partial<Var>,
		get data() {
			if (varState._source === 'nchan') return this._data;
			return cloneDeep(data) as unknown as Partial<Var>;
		},
		switchSource: vi.fn(source => {
			varState._source = source;
		}),
	};

	return {
		varState,
	};
});

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
	const { generateData } = await import('@app/common/dashboard/generate-data');
	const { varState } = await import('@app/core/states/var');
	const result = await generateData();

	expect(result).toMatchInlineSnapshot(`
		{
		  "apps": {
		    "installed": 0,
		    "started": 0,
		  },
		  "array": undefined,
		  "config": {
		    "error": null,
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
		      "version": "${getters.config().api.version}",
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

	// .switchSource should not have been called at all since we passed it valid data
	expect(vi.mocked(varState.switchSource)).toBeCalledTimes(0);
}, 30_000);

test('Calls .switchSource("file") if nchan data is invalid', async () => {
	const { generateData } = await import('@app/common/dashboard/generate-data');
	const { varState } = await import('@app/core/states/var');

	// Reset mock counter
	vi.mocked(varState.switchSource)?.mockClear?.();

	// Add invalid data to varState
	(varState._data as Partial<Var>) = {
		...varState._data,
		// This is purposely incorrect for the test
		name: 3_000 as unknown as string,
	};

	const result = await generateData();

	expect(result).toMatchInlineSnapshot(`
		{
		  "apps": {
		    "installed": 0,
		    "started": 0,
		  },
		  "array": undefined,
		  "config": {
		    "error": null,
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
		      "version": "${getters.config().api.version}",
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

	// .switchSource should have been called as we passed it invalid data
	expect(vi.mocked(varState.switchSource)).toBeCalledTimes(1);
}, 10_000);
