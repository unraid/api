import { expect, test, vi } from 'vitest';
import { getKeyFile } from '../../../../core/utils/misc/get-key-file';

vi.mock('../../../../core/states/var', () => ({
	varState: {
		data: {
			flashGuid: '123-123-123-123',
			mdState: 'STARTED'
		}
	}
}));

test('Returns the key-file', async () => {
	await expect(getKeyFile('')).resolves.toBe('');
});
