import { expect, test, vi, type SpyInstance } from 'vitest';
import { v4 as randomUUID } from 'uuid';
import readline from 'readline';
import { type Cloud } from '@app/graphql/resolvers/query/cloud/create-response';

// Preloading imports for faster tests
import '@app/core/log';
import '@app/cli/commands/report';

vi.mock('readline', () => {
	const writeStub = vi.fn();
	const closeStub = vi.fn();
	return {
		writeStub,
		closeStub,
		default: {
			createInterface: vi.fn(() => ({
				write: writeStub,
				close: closeStub,
			})),
		},
	};
});

vi.mock('fs', () => ({
	readFileSync(path: string) {
		if (path === '/etc/unraid-version') return 'version="6.10.1"';
		return undefined;
	},
	existsSync(path: string) {
		return path === '/etc/unraid-version';
	},
	writeFileSync() {
		return undefined;
	},
}));

vi.mock('fs/promises', () => ({
	readFile: vi.fn(async () => ''),
	writeFile: vi.fn(async () => ''),
	stat: vi.fn(async () => {
		throw new Error('missing file');
	}),
	access: vi.fn(async () => {
		const fs = await vi.importActual<typeof import('fs')>('fs');
		return fs.access;
	}),
}));

vi.mock('got', () => ({
	got: vi.fn(async (_url, opts: { body: string }) => {
		if (opts.body.includes('cloud')) {
			const data: { data: { cloud: Cloud } } = {
				data: {
					cloud: {
						error: null,
						apiKey: { valid: true, error: null },
						relay: { status: 'connected', error: null, timeout: null },
						minigraphql: { status: 'connected' },
						cloud: { status: 'ok', ip: '52.40.54.163', error: null },
						allowedOrigins: [],
					},
				},
			};
			return {
				body: JSON.stringify(data),
			};
		}

		if (opts.body === '{"query":"query{servers{name guid status owner{username}}}"}') {
			return { body: JSON.stringify({ data: { servers: [{ name: 'Tower', guid: 'ABCD-ABCD-ABCD-ABCD', status: 'online', owner: { username: 'api-test-runner' } }] } }) };
		}

		throw new Error(`Unmocked query "${opts.body}"`);
	}),
}));

vi.mock('@app/core/utils/misc/parse-config', () => ({
	parseConfig: vi.fn(() => ({
		upc: {
			apikey: randomUUID(),
		},
		remote: {
			username: 'api-test-runner',
		},
	})),
}));

vi.mock('@app/cli/get-unraid-api-pid', () => ({
	getUnraidApiPid: vi.fn(async () => 234_234),
}));

vi.mock('process');

test('Returns a JSON anonymised report when provided the --json cli argument [online servers]', async () => {
	const { writeStub, closeStub } = await import('readline') as unknown as { writeStub: SpyInstance; closeStub: SpyInstance };

	const { stdout } = await import('process');

	// The args we'll pass to the report function
	const args = ['--json'];

	// The report should succeed
	const { report } = await import('@app/cli/commands/report');
	await expect(report(...args)).resolves.toBe(undefined);

	// This should be run in interactive mode
	expect(vi.mocked(readline).createInterface.mock.calls.length).toBe(1);

	expect(vi.mocked(stdout).write.mock.calls.length).toBe(1);
	expect(JSON.parse(vi.mocked(stdout).write.mock.calls[0][0] as string)).toMatchInlineSnapshot(`
		{
		  "api": {
		    "environment": "THIS_WILL_BE_REPLACED_WHEN_BUILT",
		    "nodeVersion": "v18.5.0",
		    "status": "running",
		    "version": "THIS_WILL_BE_REPLACED_WHEN_BUILT",
		  },
		  "apiKey": "valid",
		  "cloud": {
		    "ip": "52.40.54.163",
		    "status": "ok",
		  },
		  "minigraph": {
		    "status": "connected",
		  },
		  "myServers": {
		    "myServersUsername": "api-test-runner",
		    "status": "authenticated",
		  },
		  "os": {
		    "serverName": "Tower",
		    "version": "6.10.1",
		  },
		  "relay": {
		    "status": "connected",
		  },
		}
	`);

	// Should not call readline write as this is non-interactive
	expect(writeStub.mock.calls.length).toBe(0);

	// Should close the readline interface at the end of the report
	expect(closeStub.mock.calls.length).toBe(1);
});

test('Returns a JSON anonymised report when provided the --json cli argument [online servers] [-vv]', async () => {
	const { writeStub, closeStub } = await import('readline') as unknown as { writeStub: SpyInstance; closeStub: SpyInstance };

	const { stdout } = await import('process');

	// The args we'll pass to the report function
	const args = ['--json', '-vv'];

	// The report should succeed
	const { report } = await import('@app/cli/commands/report');
	await expect(report(...args)).resolves.toBe(undefined);

	// This should be run in interactive mode
	expect(vi.mocked(readline).createInterface.mock.calls.length).toBe(1);

	expect(vi.mocked(stdout).write.mock.calls.length).toBe(1);
	expect(JSON.parse(vi.mocked(stdout).write.mock.calls[0][0] as string)).toMatchInlineSnapshot(`
		{
		  "api": {
		    "environment": "THIS_WILL_BE_REPLACED_WHEN_BUILT",
		    "nodeVersion": "v18.5.0",
		    "status": "running",
		    "version": "THIS_WILL_BE_REPLACED_WHEN_BUILT",
		  },
		  "apiKey": "valid",
		  "cloud": {
		    "allowedOrigins": [],
		    "ip": "52.40.54.163",
		    "status": "ok",
		  },
		  "minigraph": {
		    "status": "connected",
		  },
		  "myServers": {
		    "myServersUsername": "api-test-runner",
		    "status": "authenticated",
		  },
		  "os": {
		    "serverName": "Tower",
		    "version": "6.10.1",
		  },
		  "relay": {
		    "status": "connected",
		  },
		  "servers": {
		    "invalid": [],
		    "offline": [],
		    "online": [
		      {
		        "guid": "ABCD-ABCD-ABCD-ABCD",
		        "name": "Tower",
		        "owner": {
		          "username": "api-test-runner",
		        },
		        "status": "online",
		      },
		    ],
		  },
		}
	`);

	// Should not call readline write as this is non-interactive
	expect(writeStub.mock.calls.length).toBe(0);

	// Should close the readline interface at the end of the report
	expect(closeStub.mock.calls.length).toBe(1);
});
