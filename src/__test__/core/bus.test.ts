import NanoBus from 'nanobus';
import { assert, test } from 'vitest';
import { bus } from '../../core/bus';

test('Returns a nano bus', () => {
	assert(bus instanceof NanoBus);
});
