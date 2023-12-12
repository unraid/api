import { expect, test } from 'vitest';
import { setupPermissions } from '@app/core/permissions';

test('Returns default permissions', () => {
	expect(setupPermissions()).toMatchSnapshot();
});
