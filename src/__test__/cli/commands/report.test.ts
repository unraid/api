import { expect, SpyInstanceFn, test, vi } from 'vitest';
import { v4 as randomUUID } from 'uuid';
import readline from 'readline';

test('anonymise origins removes .sock origins', async () => {
	const { anonymiseOrigins } = await import('../../../cli/commands/report');
	expect(anonymiseOrigins(['/var/run/test.sock'])).toEqual([]);
});

test('anonymise origins hides WAN port', async () => {
	const { anonymiseOrigins } = await import('../../../cli/commands/report');
	expect(anonymiseOrigins(['https://domain.tld:443'])).toEqual(['https://domain.tld:WANPORT']);
});

test('Returns a pretty anonymised report by deafult', async () => {
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
		default: vi.fn(async (_url, opts) => {
			if (opts.body === '{"query":"query{cloud{error apiKey{valid error}relay{status timeout error}mothership{status error}allowedOrigins}}"}') {
				return { body: JSON.stringify({ data: { cloud: { apiKey: { valid: true }, relay: { error: 'API is offline', timeout: undefined }, mothership: { status: 'ok' } } } }) };
			}

			return undefined;
		})
	}));
	vi.mock('../../../core/utils/misc/parse-config', () => ({
		parseConfig: vi.fn(() => ({
			upc: {
				apikey: randomUUID()
			}
		}))
	}));
	vi.mock('process');

	const { writeStub, closeStub } = await import('readline') as unknown as { writeStub: SpyInstanceFn<any[]>; closeStub: SpyInstanceFn<any[]> };
	const { cliLogger } = await import('../../../core/log');
	const { stdout } = await import('process');
	const cliDebugLoggerSpy = vi.spyOn(cliLogger, 'debug');
	const cliTraceLoggerSpy = vi.spyOn(cliLogger, 'trace');

	// The report should succeed
	const { report } = await import('../../../cli/commands/report');
	await expect(report()).resolves.toBe(undefined);

	// This should be run in interactive mode
	expect(vi.mocked(readline).createInterface.mock.calls.length).toBe(1);

	// Should have logged report to console
	expect(cliDebugLoggerSpy.mock.calls.length).toBe(1);
	expect(cliDebugLoggerSpy.mock.calls[0]).toEqual(['Setting process.env[LOG_TYPE] = raw']);
	expect(cliTraceLoggerSpy.mock.calls.length).toBe(3);
	expect(cliTraceLoggerSpy.mock.calls[0]).toEqual(['Got unraid OS version "%s"', 'unknown']);
	expect(cliTraceLoggerSpy.mock.calls[1]).toEqual(['Cloud response %s', JSON.stringify({ apiKey: { valid: true }, relay: { error: 'API is offline' }, mothership: { status: 'ok' } })]);
	expect(cliTraceLoggerSpy.mock.calls[2]).toEqual(['Skipped checking for servers as local graphql is offline']);

	expect(vi.mocked(stdout).write.mock.calls.length).toBe(1);
	expect(vi.mocked(stdout).write.mock.calls[0]).toMatchInlineSnapshot(`
		[
		  "<-----UNRAID-API-REPORT----->
		SERVER_NAME: Tower
		ENVIRONMENT: undefined
		UNRAID_VERSION: unknown
		UNRAID_API_VERSION: THIS_WILL_BE_REPLACED_WHEN_BUILT (stopped)
		NODE_VERSION: v18.3.0
		API_KEY: valid
		MY_SERVERS: signed out
		RELAY: API is offline
		MOTHERSHIP: ok
		SERVERS: API is offline
		HAS_CRASH_LOGS: no
		</----UNRAID-API-REPORT----->
		",
		]
	`);

	// Should not call readline write as this is non-interactive
	expect(writeStub.mock.calls.length).toBe(0);

	// Should close the readline interface at the end of the report
	expect(closeStub.mock.calls.length).toBe(1);
});
