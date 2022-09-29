import { expect, SpyInstance, test, vi } from 'vitest';
import { v4 as randomUUID } from 'uuid';
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

vi.mock('@app/core/utils/misc/parse-config', () => ({
	parseConfig: vi.fn(() => ({
		upc: {
			apikey: randomUUID(),
		},
	})),
}));

vi.mock('process');

test('Returns a JSON anonymised report when provided the --json cli argument [no servers]', async () => {
	const { writeStub, closeStub } = await import('readline') as unknown as { writeStub: SpyInstance; closeStub: SpyInstance };
	const { cliLogger } = await import('@app/core/log');
	const { stdout } = await import('process');
	const cliDebugLoggerSpy = vi.spyOn(cliLogger, 'debug');
	const cliTraceLoggerSpy = vi.spyOn(cliLogger, 'trace');

	// The args we'll pass to the report function
	const args = ['--json'];

	// The report should succeed
	const { report } = await import('@app/cli/commands/report');
	await expect(report(...args)).resolves.toBe(undefined);

	// This should be run in interactive mode
	expect(vi.mocked(readline).createInterface.mock.calls.length).toBe(1);

	// Should have logged report to console
	expect(cliDebugLoggerSpy.mock.calls.length).toBe(1);
	expect(cliDebugLoggerSpy.mock.calls[0]).toEqual(['Setting process.env[LOG_TYPE] = raw']);
	expect(cliTraceLoggerSpy.mock.calls.length).toBe(3);
	expect(cliTraceLoggerSpy.mock.calls[0]).toEqual(['Got unraid OS version "%s"', 'unknown']);
	expect(cliTraceLoggerSpy.mock.calls[1][0]).toEqual('Cloud response %s');
	expect(JSON.parse(cliTraceLoggerSpy.mock.calls[1][1])).toMatchInlineSnapshot(`
		{
		  "allowedOrigins": [],
		  "apiKey": {
		    "error": null,
		    "valid": true,
		  },
		  "cloud": {
		    "error": null,
		    "ip": "52.40.54.163",
		    "status": "ok",
		  },
		  "error": null,
		  "minigraphql": {
		    "status": "disconnected",
		  },
		  "relay": {
		    "error": "API is offline",
		    "status": "disconnected",
		    "timeout": null,
		  },
		}
	`);
	expect(cliTraceLoggerSpy.mock.calls[2]).toEqual(['Skipped checking for servers as local graphql is offline']);

	// Check cloud data was fetched correctly
	expect(vi.mocked(stdout).write.mock.calls.length).toBe(1);
	expect(JSON.parse(vi.mocked(stdout).write.mock.calls[0][0] as string)).toMatchInlineSnapshot(`
		{
		  "api": {
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
		    "status": "API is offline",
		  },
		  "servers": {
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
