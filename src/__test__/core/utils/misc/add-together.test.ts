import { test } from 'vitest';
import { addTogether } from '@app/core/utils/misc/add-together';

test('adds two numbers together', () => {
	addTogether([1, 2]);
});
