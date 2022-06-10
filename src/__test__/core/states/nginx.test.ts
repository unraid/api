import { expect, test } from 'vitest';
import { NginxState } from '../../../core/states/nginx';

test('NginxState is a singleton', () => {
	expect(new NginxState()).toBe(new NginxState());
});
