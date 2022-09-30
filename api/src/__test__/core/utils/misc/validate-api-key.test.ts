import { expect, test, vi } from 'vitest';
import { validateApiKey } from '@app/core/utils/misc/validate-api-key';

// Preloading imports for faster tests
import '@app/core/log';

vi.mock('@app/core/log', () => ({
	logger: {
		addContext: vi.fn(),
		removeContext: vi.fn(),
		info: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
		trace: vi.fn(),
	},
	graphqlLogger: {
		addContext: vi.fn(),
		removeContext: vi.fn(),
		info: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
		trace: vi.fn(),
	},
}));

test('Returns false when API key is invalid', async () => {
	await expect(validateApiKey('this-is-an-invalid-api-key', false)).resolves.toBe(false);
});
