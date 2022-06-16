import { expect, test, vi } from 'vitest';
import { getKeyFile } from '@app/core/utils/misc/get-key-file';

vi.mock('@app/core/states/var', () => ({
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
