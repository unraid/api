import { beforeEach, expect, test, vi } from 'vitest';

// Preloading imports for faster tests
import '@app/mothership/utils/convert-to-fuzzy-time';

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
