import { expect, test } from 'vitest';
import { Network } from '../../../core/states/network';

test('Network is a singleton', () => {
	expect(new Network()).toBe(new Network());
});
