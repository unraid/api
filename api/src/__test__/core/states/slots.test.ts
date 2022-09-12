import { expect, test } from 'vitest';
import { Slots } from '@app/core/states/slots';

test('Slots is a singleton', () => {
	expect(new Slots()).toBe(new Slots());
});
