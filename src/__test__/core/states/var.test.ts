import { expect, test } from 'vitest';
import { VarState } from '../../../core/states/var';

test('VarState is a singleton', () => {
	expect(new VarState()).toBe(new VarState());
});
