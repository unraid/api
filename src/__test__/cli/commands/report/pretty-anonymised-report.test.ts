import { expect, SpyInstanceFn, test, vi } from 'vitest';
import { v4 as randomUUID } from 'uuid';
import readline from 'readline';
import { Cloud } from '@app/graphql/resolvers/query/cloud/create-response';

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
}));

vi.mock('got', () => ({
	got: vi.fn(async (_url, opts: { body: string }) => {
		if (opts.body === '{"query":"query{cloud{error apiKey{valid}relay{status timeout error}minigraphql{status}cloud{status error ip}allowedOrigins}}"}') {
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
	})),
}));

vi.mock('process');

test('Returns a pretty anonymised report by default', async () => {
	const { writeStub, closeStub } = await import('readline') as unknown as { writeStub: SpyInstanceFn; closeStub: SpyInstanceFn };
	const { cliLogger } = await import('@app/core/log');
	const { stdout } = await import('process');
	const cliDebugLoggerSpy = vi.spyOn(cliLogger, 'debug');
	const cliTraceLoggerSpy = vi.spyOn(cliLogger, 'trace');

	// The report should succeed
	const { report } = await import('@app/cli/commands/report');
	await expect(report()).resolves.toBe(undefined);

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
		    "status": "connected",
		  },
		  "relay": {
		    "error": null,
		    "status": "connected",
		    "timeout": null,
		  },
		}
	`);
	expect(cliTraceLoggerSpy.mock.calls[2]).toEqual(['Skipped checking for servers as local graphql is offline']);

	expect(vi.mocked(stdout).write.mock.calls.length).toBe(1);
	expect(vi.mocked(stdout).write.mock.calls[0][0]).toMatchInlineSnapshot(`
		"<-----UNRAID-API-REPORT----->
		SERVER_NAME: Tower
		ENVIRONMENT: THIS_WILL_BE_REPLACED_WHEN_BUILT
		UNRAID_VERSION: unknown
		UNRAID_API_VERSION: THIS_WILL_BE_REPLACED_WHEN_BUILT (stopped)
		NODE_VERSION: v18.3.0
		API_KEY: valid
		MY_SERVERS: signed out
		CLOUD: ok
		RELAY: connected
		MINI-GRAPH: connected
		SERVERS: API is offline
		HAS_CRASH_LOGS: no
		</----UNRAID-API-REPORT----->
		"
	`);

	// Should not call readline write as this is non-interactive
	expect(writeStub.mock.calls.length).toBe(0);

	// Should close the readline interface at the end of the report
	expect(closeStub.mock.calls.length).toBe(1);
}, 10_000);
