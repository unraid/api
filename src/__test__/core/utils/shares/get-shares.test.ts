import { expect, test, vi } from 'vitest';
import { getShares } from '@app/core/utils/shares/get-shares';

vi.mock('@app/core/states/shares', () => ({
	sharesState: {
		find: vi.fn(() => []),
		findOne: vi.fn(() => ({})),
	},
}));

vi.mock('@app/core/states/smb-sec', () => ({
	smbSecState: {
		find: vi.fn(() => []),
		findOne: vi.fn(() => ({})),
	},
}));

vi.mock('@app/core/states/nfs-sec', () => ({
	nfsSecState: {
		find: vi.fn(() => []),
		findOne: vi.fn(() => ({})),
	},
}));

vi.mock('@app/core/states/slots', () => ({
	slotsState: {
		find: vi.fn(() => []),
		findOne: vi.fn(() => ({})),
	},
}));

test('Returns all the servers shares', () => {
	expect(getShares()).toEqual({
		disks: [],
		users: [],
	});
});

test('Returns all shares for label', () => {
	expect(getShares('user')).toEqual({
		nfs: {},
		smb: {},
		type: 'user',
	});

	expect(getShares('disk')).toEqual({
		free: NaN,
		name: undefined,
		nfs: {},
		size: NaN,
		smb: {},
		type: 'disk',
	});

	expect(getShares('users')).toEqual([]);

	expect(getShares('disks')).toEqual([]);
});
