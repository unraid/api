import { expect, SpyInstanceFn, test, vi } from 'vitest';
import { v4 as randomUUID } from 'uuid';
import readline from 'readline';

vi.mock('readline', () => {
	const writeStub = vi.fn();
	const closeStub = vi.fn();
	return {
		writeStub,
		closeStub,
		default: {
			createInterface: vi.fn(() => ({
				write: writeStub,
				close: closeStub
			}))
		}
	};
});

vi.mock('fs');

vi.mock('fs/promises', () => ({
	readFile: vi.fn(async () => ''),
	stat: vi.fn(async () => {
		throw new Error('missing file');
	})
}));

vi.mock('got', () => ({
	default: vi.fn().mockImplementationOnce(async (_url, opts: Record<string, string>) => {
		if (opts.body === '{"query":"query{cloud{error apiKey{valid}relay{status timeout error}minigraphql{connected}cloud{status error ip}allowedOrigins}}"}') {
			return {
				body: JSON.stringify({
					data: {
						cloud: {
							apiKey: { valid: true },
							relay: { status: 'connected' },
							minigraphql: { connected: true },
							cloud: { status: 'ok', ip: '52.40.54.163' },
							allowedOrigins: []
						}
					}
				})
			};
		}

		throw new Error(`Unmocked query "${opts.body}"`);
	}).mockImplementationOnce(async (_url, opts: Record<string, string>) => {
		if (opts.body === '{"query":"query{cloud{error apiKey{valid}relay{status timeout error}minigraphql{connected}cloud{status error ip}allowedOrigins}}"}') {
			return {
				body: JSON.stringify({
					data: {
						cloud: {
							apiKey: { valid: true },
							relay: { status: 'disconnected', error: 'Mothership is restarting' },
							minigraphql: { connected: false },
							cloud: { status: 'error', error: 'Mothership is restarting' },
							allowedOrigins: []
						}
					}
				})
			};
		}

		throw new Error(`Unmocked query "${opts.body}"`);
	})
}));

vi.mock('@app/core/utils/misc/parse-config', () => ({
	parseConfig: vi.fn(() => ({
		upc: {
			apikey: randomUUID()
		}
	}))
}));

vi.mock('process');

test('Returns a pretty non-anonymised report with -v', async () => {
	const { writeStub, closeStub } = await import('readline') as unknown as { writeStub: SpyInstanceFn<any[]>; closeStub: SpyInstanceFn<any[]> };
	const { cliLogger } = await import('@app/core/log');
	const { stdout } = await import('process');
	const cliDebugLoggerSpy = vi.spyOn(cliLogger, 'debug');
	const cliTraceLoggerSpy = vi.spyOn(cliLogger, 'trace');

	// The args we'll pass to the report function
	const args = ['-v'];

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
		    "valid": true,
		  },
		  "cloud": {
		    "ip": "52.40.54.163",
		    "status": "ok",
		  },
		  "minigraphql": {
		    "connected": true,
		  },
		  "relay": {
		    "status": "connected",
		  },
		}
	`);
	expect(cliTraceLoggerSpy.mock.calls[2]).toEqual(['Skipped checking for servers as local graphql is offline']);

	expect(vi.mocked(stdout).write.mock.calls.length).toBe(1);
	expect(vi.mocked(stdout).write.mock.calls[0][0]).toMatchInlineSnapshot(`
		"<-----UNRAID-API-REPORT----->
		SERVER_NAME: Tower
		ENVIRONMENT: undefined
		UNRAID_VERSION: unknown
		UNRAID_API_VERSION: THIS_WILL_BE_REPLACED_WHEN_BUILT (stopped)
		NODE_VERSION: v18.3.0
		API_KEY: valid
		MY_SERVERS: signed out
		CLOUD: ok [IP=52.40.54.163]
		RELAY: connected
		MINI-GRAPH: connected
		SERVERS: API is offline
		ALLOWED_ORIGINS:
		HAS_CRASH_LOGS: no
		</----UNRAID-API-REPORT----->
		"
	`);

	// Should not call readline write as this is non-interactive
	expect(writeStub.mock.calls.length).toBe(0);

	// Should close the readline interface at the end of the report
	expect(closeStub.mock.calls.length).toBe(1);
}, 10_000);

test('Returns a pretty non-anonymised report with -v [mothership restarting]', async () => {
	const { writeStub, closeStub } = await import('readline') as unknown as { writeStub: SpyInstanceFn<any[]>; closeStub: SpyInstanceFn<any[]> };
	const { cliLogger } = await import('@app/core/log');
	const { stdout } = await import('process');
	const cliDebugLoggerSpy = vi.spyOn(cliLogger, 'debug');
	const cliTraceLoggerSpy = vi.spyOn(cliLogger, 'trace');

	// Reset mock counters
	vi.mocked(readline.createInterface).mockClear();
	vi.mocked(stdout.write).mockClear();
	vi.mocked(closeStub).mockClear();

	// Mark mothership as restarting
	const { relayStore } = await import('@app/mothership/store');
	relayStore.code = 12;
	relayStore.reason = 'SERVICE_RESTART';
	relayStore.relay = undefined;
	relayStore.timeout = Date.now() + 60_000;

	// The args we'll pass to the report function
	const args = ['-v'];

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
		    "valid": true,
		  },
		  "cloud": {
		    "error": "Mothership is restarting",
		    "status": "error",
		  },
		  "minigraphql": {
		    "connected": false,
		  },
		  "relay": {
		    "error": "Mothership is restarting",
		    "status": "disconnected",
		  },
		}
	`);
	expect(cliTraceLoggerSpy.mock.calls[2]).toEqual(['Skipped checking for servers as local graphql is offline']);

	expect(vi.mocked(stdout).write.mock.calls.length).toBe(1);
	expect(vi.mocked(stdout).write.mock.calls[0][0]).toMatchInlineSnapshot(`
		"<-----UNRAID-API-REPORT----->
		SERVER_NAME: Tower
		ENVIRONMENT: undefined
		UNRAID_VERSION: unknown
		UNRAID_API_VERSION: THIS_WILL_BE_REPLACED_WHEN_BUILT (stopped)
		NODE_VERSION: v18.3.0
		API_KEY: valid
		MY_SERVERS: signed out
		CLOUD: Mothership is restarting
		RELAY: Mothership is restarting
		MINI-GRAPH: disconnected
		SERVERS: API is offline
		ALLOWED_ORIGINS:
		HAS_CRASH_LOGS: no
		</----UNRAID-API-REPORT----->
		"
	`);

	// Should not call readline write as this is non-interactive
	expect(writeStub.mock.calls.length).toBe(0);

	// Should close the readline interface at the end of the report
	expect(closeStub.mock.calls.length).toBe(1);
}, 10_000);
