import { expect, test } from 'vitest';
import { permissions } from '../../core/default-permissions';

test('Returns default permissions', () => {
	expect(permissions).toMatchSnapshot();
});
