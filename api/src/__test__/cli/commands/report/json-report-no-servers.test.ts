import { expect, SpyInstance, test, vi } from 'vitest';
import readline from 'readline';
import { Cloud } from '@app/graphql/resolvers/query/cloud/create-response';

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

vi.mock('fs');

vi.mock('fs/promises', () => ({
	readFile: vi.fn(async () => ''),
	writeFile: vi.fn(async () => ''),
	stat: vi.fn(async () => {
		throw new Error('missing file');
	}),
	access: vi.fn(async () => {
		throw new Error('missing file');
	}),
}));

vi.mock('got', () => ({
	got: vi.fn(async (url, opts: { body: string }) => {
		if (opts.body === '{"query":"query{cloud{error apiKey{valid}relay{status timeout error}minigraphql{status}cloud{status error ip}allowedOrigins}}"}') {
			const data: { data: { cloud: Cloud } } = {
				data: {
					cloud: {
						error: null,
						apiKey: { valid: true, error: null },
						relay: { status: 'disconnected', error: 'API is offline', timeout: null },
						minigraphql: { status: 'disconnected' },
						cloud: { status: 'ok', ip: '52.40.54.163', error: null },
						allowedOrigins: [],
					},
				},
			};
			return {
				body: JSON.stringify(data),
			};
		}

		throw new Error(`Unmocked query "${opts.body}"`);
	}),
}));
vi.mock('process');

test('Returns a JSON anonymised report when provided the --json cli argument [no servers]', async () => {
	const { writeStub, closeStub } = await import('readline') as unknown as { writeStub: SpyInstance; closeStub: SpyInstance };

	const { stdout } = await import('process');

	// The args we'll pass to the report function
	const args = ['--json'];

	// The report should succeed
	const { report } = await import('@app/cli/commands/report');
	await expect(report(...args)).resolves.toBe(undefined);

	// This should be run in interactive mode
	expect(vi.mocked(readline).createInterface.mock.calls.length).toBe(1);

	// Check cloud data was fetched correctly
	expect(vi.mocked(stdout).write.mock.calls.length).toBe(1);
	expect(JSON.parse(vi.mocked(stdout).write.mock.calls[0][0] as string)).toMatchInlineSnapshot(`
		{
		  "api": {
		    "environment": "THIS_WILL_BE_REPLACED_WHEN_BUILT",
		    "nodeVersion": "v18.5.0",
		    "status": "stopped",
		    "version": "THIS_WILL_BE_REPLACED_WHEN_BUILT",
		  },
		  "apiKey": "valid",
		  "cloud": {
		    "ip": "52.40.54.163",
		    "status": "ok",
		  },
		  "minigraph": {
		    "status": "disconnected",
		  },
		  "myServers": {
		    "status": "signed out",
		  },
		  "os": {
		    "serverName": "Tower",
		    "version": "unknown",
		  },
		  "relay": {
		    "error": "API is offline",
		    "status": "disconnected",
		  },
		}
	`);

	// Should not call readline write as this is non-interactive
	expect(writeStub.mock.calls.length).toBe(0);

	// Should close the readline interface at the end of the report
	expect(closeStub.mock.calls.length).toBe(1);
});

test('Returns a JSON anonymised report when provided the --json cli argument [no servers] [-vv]', async () => {
	const { writeStub, closeStub } = await import('readline') as unknown as { writeStub: SpyInstance; closeStub: SpyInstance };

	const { stdout } = await import('process');

	// The args we'll pass to the report function
	const args = ['--json', '-vv'];

	// The report should succeed
	const { report } = await import('@app/cli/commands/report');
	await expect(report(...args)).resolves.toBe(undefined);

	// This should be run in interactive mode
	expect(vi.mocked(readline).createInterface.mock.calls.length).toBe(1);

	// Check cloud data was fetched correctly
	expect(vi.mocked(stdout).write.mock.calls.length).toBe(1);
	expect(JSON.parse(vi.mocked(stdout).write.mock.calls[0][0] as string)).toMatchInlineSnapshot(`
		{
		  "api": {
		    "environment": "THIS_WILL_BE_REPLACED_WHEN_BUILT",
		    "nodeVersion": "v18.5.0",
		    "status": "stopped",
		    "version": "THIS_WILL_BE_REPLACED_WHEN_BUILT",
		  },
		  "apiKey": "valid",
		  "cloud": {
		    "allowedOrigins": [],
		    "ip": "52.40.54.163",
		    "status": "ok",
		  },
		  "minigraph": {
		    "status": "disconnected",
		  },
		  "myServers": {
		    "status": "signed out",
		  },
		  "os": {
		    "serverName": "Tower",
		    "version": "unknown",
		  },
		  "relay": {
		    "error": "API is offline",
		    "status": "disconnected",
		  },
		  "servers": {
		    "invalid": [],
		    "offline": [],
		    "online": [],
		  },
		}
	`);

	// Should not call readline write as this is non-interactive
	expect(writeStub.mock.calls.length).toBe(0);

	// Should close the readline interface at the end of the report
	expect(closeStub.mock.calls.length).toBe(1);
});
