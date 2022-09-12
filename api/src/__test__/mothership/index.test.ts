import { beforeEach, expect, test, vi } from 'vitest';

vi.mock('@app/mothership/get-relay-connection-status', () => ({
	getRelayConnectionStatus: vi.fn(),
}));

vi.mock('@app/core/api-manager', () => ({
	apiManager: {
		cloudKey: 'my-cloud-key',
		expire: vi.fn(),
	},
}));

vi.mock('fs', () => ({
	default: {
		readFileSync: vi.fn().mockReturnValue('my-file'),
		writeFileSync: vi.fn(),
		existsSync: vi.fn(),
	},
	readFileSync: vi.fn().mockReturnValue('my-file'),
	existsSync: vi.fn(),
}));

vi.mock('@graphql-tools/schema', () => ({
	makeExecutableSchema: vi.fn(),
}));

vi.mock('rotating-file-stream', () => ({
	createStream: vi.fn().mockImplementation(() => ({ write: vi.fn() })),
}));

vi.mock('@app/core/log', () => ({
	default: { relayLogger: { trace: vi.fn() } },
	relayLogger: { trace: vi.fn(), addContext: vi.fn(), removeContext: vi.fn() },
	logger: { trace: vi.fn() },
}));

beforeEach(() => {
	vi.resetModules();
	vi.clearAllMocks();
});

const generateTestCases = () => {
	const cases: Array<{ min: number; max: number }> = [];
	for (let i = 0; i < 15; i += 1) {
		const min = Math.round(Math.random() * 100);
		const max = min + (Math.round(Math.random() * 20));
		cases.push({ min, max });
	}

	return cases;
};

test.each(generateTestCases())('Successfully converts to fuzzy time %o', async ({ min, max }) => {
	const { convertToFuzzyTime } = await import('@app/mothership/utils/convert-to-fuzzy-time');

	const res = convertToFuzzyTime(min, max);
	expect(res).toBeGreaterThanOrEqual(min);
	expect(res).toBeLessThanOrEqual(max);
});

test('saveIncomingWebsocketMessageToDisk', async () => {
	const { saveIncomingWebsocketMessageToDisk } = await import('@app/mothership/save-websocket-message-to-disk');
	const { createStream } = await import('rotating-file-stream');

	// Expect throw because for some reason the current implementation won't use the mocked write function

	saveIncomingWebsocketMessageToDisk('my-message');

	expect(createStream).toHaveBeenCalledWith('/var/log/unraid-api/relay-incoming-messages.log', {
		size: '10M', // Rotate every 10 MegaBytes written
		interval: '1d', // Rotate daily
		compress: 'gzip', // Compress rotated files
		maxFiles: parseInt(process.env.LOG_MOTHERSHIP_MESSAGES_MAX_FILES ?? '2', 10), // Keep a maximum of 2 log files
	});
});

test('Runs subscriptionListener successfully', async () => {
	const index = await import('@app/mothership/subscription-listener');

	index.subscriptionListener('my-id', 'my-name')('my-data');
	// @TODO: This should be refactored to be an actual async function, otherwise we can have errors that are uncatchable.
	index.subscriptionListener('my-id', 'array')('my-data-2');
	index.subscriptionListener('my-id', 'my-data');
});

/*
Test('getRelayHeaders', () => {
	varState.data.flashGuid = 'my-guid';
	varState.data.name = 'my-server-name';

	const headers = getRelayHeaders();
	expect(headers).toEqual(expect.objectContaining({
		'x-api-key': 'my-cloud-key',
		'x-flash-guid': varState.data?.flashGuid,
		'x-server-name': 'my-server-name',
		'x-unraid-api-version': expect.anything(),
	}));
}); */

test('Successfully runs the mothership API successfully', async () => {
	// Const { apiManager } = await import('@app/core/api-manager');
	// await import('@app/mothership/index');
});
