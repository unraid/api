import { expect, test } from 'vitest';
import { Slots } from '../../../core/states/slots';

test('Slots is a singleton', () => {
	expect(new Slots()).toBe(new Slots());
});
