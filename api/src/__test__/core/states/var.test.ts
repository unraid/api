import { expect, test } from 'vitest';
import { VarState } from '@app/core/states/var';

test('VarState is a singleton', () => {
	expect(new VarState()).toBe(new VarState());
});
