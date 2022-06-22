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

vi.mock('fs', () => ({
	readFileSync(path: string) {
		if (path === '/etc/unraid-version') return 'version="6.10.1"';
		return undefined;
	},
	existsSync(path: string) {
		return path === '/etc/unraid-version';
	}
}));

vi.mock('fs/promises', () => ({
	readFile: vi.fn(async () => ''),
	stat: vi.fn(async () => {
		throw new Error('missing file');
	})
}));

vi.mock('got', () => ({
	default: vi.fn(async (_url, opts) => {
		if (opts.body === '{"query":"query{cloud{error apiKey{valid error}relay{status timeout error}minigraphql{connected}cloud{status error}allowedOrigins}}"}') {
			return { body: JSON.stringify({ data: { cloud: { apiKey: { valid: true }, relay: { status: 'open', timeout: undefined }, minigraphql: { connected: true }, cloud: { status: 'ok' }, allowedOrigins: [] } } }) };
		}

		if (opts.body === '{"query":"query{servers{name guid status owner{username}}}"}') {
			return { body: JSON.stringify({ data: { servers: [{ name: 'Tower', guid: 'ABCD-ABCD-ABCD-ABCD', status: 'online', owner: { username: 'api-test-runner' } }] } }) };
		}

		return undefined;
	})
}));

vi.mock('@app/core/utils/misc/parse-config', () => ({
	parseConfig: vi.fn(() => ({
		upc: {
			apikey: randomUUID()
		},
		remote: {
			username: 'api-test-runner'
		}
	}))
}));

vi.mock('@app/cli/get-unraid-api-pid', () => ({
	getUnraidApiPid: vi.fn(async () => 234234)
}));

vi.mock('process');

test('Returns a JSON anonymised report when provided the --json cli argument [online servers]', async () => {
	const { writeStub, closeStub } = await import('readline') as unknown as { writeStub: SpyInstanceFn<any[]>; closeStub: SpyInstanceFn<any[]> };
	const { cliLogger } = await import('@app/core/log');
	const { stdout } = await import('process');
	const cliDebugLoggerSpy = vi.spyOn(cliLogger, 'debug');
	const cliTraceLoggerSpy = vi.spyOn(cliLogger, 'trace');

	// Reset mock counters to 0
	cliTraceLoggerSpy.mockClear();

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
	expect(cliTraceLoggerSpy.mock.calls[0]).toEqual(['Got unraid OS version "%s"', '6.10.1']);
	expect(cliTraceLoggerSpy.mock.calls[1]).toEqual(['Cloud response %s', JSON.stringify({ apiKey: { valid: true }, relay: { status: 'open' }, minigraphql: { connected: true }, cloud: { status: 'ok' }, allowedOrigins: [] })]);
	expect(cliTraceLoggerSpy.mock.calls[2]).toEqual(['Fetched %s server(s) from local graphql', 1]);

	expect(vi.mocked(stdout).write.mock.calls.length).toBe(1);
	expect(JSON.parse(vi.mocked(stdout).write.mock.calls[0][0] as string)).toMatchInlineSnapshot(`
		{
		  "apiKey": "valid",
		  "hasCrashLogs": false,
		  "minigraphStatus": true,
		  "myServers": "authenticated",
		  "myServersUsername": "api-test-runner",
		  "offlineServers": [],
		  "onlineServers": [
		    {
		      "guid": "ABCD-ABCD-ABCD-ABCD",
		      "name": "Tower",
		      "owner": {
		        "username": "api-test-runner",
		      },
		      "status": "online",
		    },
		  ],
		  "relayStatus": "connected",
		  "serverName": "Tower",
		  "unraidApiStatus": "running",
		  "unraidApiVersion": "THIS_WILL_BE_REPLACED_WHEN_BUILT",
		  "unraidVersion": "6.10.1",
		}
	`);

	// Should not call readline write as this is non-interactive
	expect(writeStub.mock.calls.length).toBe(0);

	// Should close the readline interface at the end of the report
	expect(closeStub.mock.calls.length).toBe(1);
}, 10_000);
