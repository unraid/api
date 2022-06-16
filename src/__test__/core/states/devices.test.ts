import { expect, test } from 'vitest';
import { Devices } from '@app/core/states/devices';

test('Devices is a singleton', () => {
	expect(new Devices()).toBe(new Devices());
});
