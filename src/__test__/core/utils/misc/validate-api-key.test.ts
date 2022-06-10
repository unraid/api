import { expect, test, vi } from 'vitest';
import { validateApiKey } from '../../../../core/utils/misc/validate-api-key';

vi.mock('../../../../core/log', () => ({
	logger: {
		info: vi.fn(),
		error: vi.fn(),
		debug: vi.fn()
	},
	graphqlLogger: {
		info: vi.fn(),
		error: vi.fn(),
		debug: vi.fn()
	}
}));

vi.mock('../../../../core/states/var', () => ({
	varState: {
		data: {
			flashGuid: '123-123-123-123'
		}
	}
}));

test('Returns false when API key is invalid', async () => {
	await expect(validateApiKey('this-is-an-invalid-api-key', false)).resolves.toBe(false);
});
