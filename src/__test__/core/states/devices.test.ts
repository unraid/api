import { expect, test } from 'vitest';
import { Devices } from '../../../core/states/devices';

test('Devices is a singleton', () => {
	expect(new Devices()).toBe(new Devices());
});
