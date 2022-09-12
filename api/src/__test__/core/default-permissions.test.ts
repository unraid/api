import { expect, test } from 'vitest';
import { permissions } from '@app/core/default-permissions';

test('Returns default permissions', () => {
	expect(permissions).toMatchSnapshot();
});
