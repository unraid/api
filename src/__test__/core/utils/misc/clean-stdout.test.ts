import { expect, test } from 'vitest';
import { cleanStdout } from '@app/core/utils/misc/clean-stdout';

test('Returns trimmed stdout from execa command', () => {
	expect(cleanStdout({ stdout: 'test' })).toBe('test');
	expect(cleanStdout({ stdout: 'test    ' })).toBe('test');
});

