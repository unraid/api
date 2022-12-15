import { expect, type SpyInstance, test, vi } from 'vitest';
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
		if (opts.body.includes('cloud')) {
			const data: { data: { cloud: Cloud } } = {
				data: {
					cloud: {
						error: null,
						apiKey: { valid: true, error: null },
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

vi.mock('process');

test('Returns a pretty anonymised report by default', async () => {
	const { writeStub, closeStub } = await import('readline') as unknown as { writeStub: SpyInstance; closeStub: SpyInstance };

	const { stdout } = await import('process');

	// The report should succeed
	const { report } = await import('@app/cli/commands/report');
	await expect(report()).resolves.toBe(undefined);

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
		UNRAID_API_STATUS: stopped
		API_KEY: valid
		MY_SERVERS: signed out
		CLOUD: 
			STATUS: [ok]  
		MINI-GRAPH: 
			STATUS: [connected]
		</----UNRAID-API-REPORT----->
		"
	`);

	// Should not call readline write as this is non-interactive
	expect(writeStub.mock.calls.length).toBe(0);

	// Should close the readline interface at the end of the report
	expect(closeStub.mock.calls.length).toBe(1);
});
