import { expect, test, vi } from 'vitest';
import { getKeyFile } from '@app/core/utils/misc/get-key-file';

test('Returns the key-file', async () => {
	await expect(getKeyFile('')).resolves.toBe('');
});
