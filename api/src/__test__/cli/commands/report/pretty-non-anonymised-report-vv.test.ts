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
			return { body: JSON.stringify(
				{ data:
					{ servers: [
						{ name: 'Tower',
							guid: 'ABCD-ABCD-ABCD-ABCD',
							status: 'online',
							owner: { username: 'api-test-runner' } },
						{ name: 'Tower2',
							guid: 'CBDA-CBDA-CBDA-CBDA',
							status: 'offline',
							owner: { username: 'api-test-runner' } },
						{ name: 'Tower43',
							guid: 'MY_GUID',
							status: 'unknown',
							owner: { username: 'api-test-runner' } },
					],
					},
				}),
			};
		}

		throw new Error(`Unmocked query "${opts.body}"`);
	}),
}));

vi.mock('@app/cli/get-unraid-api-pid', () => ({
	getUnraidApiPid: vi.fn(async () => 234_234),
}));

vi.mock('process');

test('Returns a pretty non-anonymised report with -vv', async () => {
	const { writeStub, closeStub } = await import('readline') as unknown as { writeStub: SpyInstance; closeStub: SpyInstance };

	const { stdout } = await import('process');

	// The args we'll pass to the report function
	const args = ['-vv'];

	// The report should succeed
	const { report } = await import('@app/cli/commands/report');
	await expect(report(...args)).resolves.toBe(undefined);

	// This should be run in interactive mode
	expect(vi.mocked(readline).createInterface.mock.calls.length).toBe(1);

	expect(vi.mocked(stdout).write.mock.calls.length).toBe(1);
	expect(vi.mocked(stdout).write.mock.calls[0][0]).toMatchInlineSnapshot(`
		"
		<-----UNRAID-API-REPORT----->
		SERVER_NAME: Tower
		ENVIRONMENT: THIS_WILL_BE_REPLACED_WHEN_BUILT
		UNRAID_VERSION: unknown
		UNRAID_API_VERSION: THIS_WILL_BE_REPLACED_WHEN_BUILT
		UNRAID_API_STATUS: running
		API_KEY: valid
		MY_SERVERS: signed out
		CLOUD: 
			STATUS: [ok] 
			IP: [52.40.54.163] 
		RELAY: 
			STATUS: [connected]  
		MINI-GRAPH: 
			STATUS: [connected]
		SERVERS:
			ONLINE: Tower[owner=\\"api-test-runner\\" guid=\\"ABCD-ABCD-ABCD-ABCD\\"]
			OFFLINE: Tower2[owner=\\"api-test-runner\\" guid=\\"CBDA-CBDA-CBDA-CBDA\\"]
			INVALID: Tower43[owner=\\"api-test-runner\\" guid=\\"MY_GUID\\"]
		ALLOWED_ORIGINS: 
		</----UNRAID-API-REPORT----->
		"
	`);

	// Should not call readline write as this is non-interactive
	expect(writeStub.mock.calls.length).toBe(0);

	// Should close the readline interface at the end of the report
	expect(closeStub.mock.calls.length).toBe(1);
}, 10_000);
