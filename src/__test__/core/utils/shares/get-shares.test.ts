import { expect, test, vi } from 'vitest';
import { getShares } from '../../../../core/utils/shares/get-shares';

vi.mock('../../../../core/states/shares', () => ({
	sharesState: {
		find: vi.fn(() => [])
	}
}));

vi.mock('../../../../core/states/slots', () => ({
	slotsState: {
		find: vi.fn(() => [])
	}
}));

test('Returns all the servers shares', () => {
	expect(getShares()).toEqual({
		disks: [],
		users: []
	});
});
