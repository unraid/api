import { test, expect } from 'vitest';
import { getWriteableConfig } from '@app/core/utils/files/config-file-noramlizer';

test('it successfully creates a config with no optional values', () => {
	getWriteableConfig();
});
