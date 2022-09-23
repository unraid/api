import { test, expect, vi } from 'vitest';
import { sync2FA } from '@app/store/sync/2fa-sync';
import { checkTwoFactorEnabled } from '@app/common/two-factor';
import { pubsub } from '@app/core/pubsub';
// Hi
vi.mock('@app/common/two-factor', () => ({
	checkTwoFactorEnabled: vi.fn(() => ({ isLocalEnabled: true, isRemoteEnabled: true })),
}));

vi.mock('@app/core/pubsub', () => ({
	pubsub: { publish: vi.fn() },
}));

test('sync 2fa', async () => {
	await sync2FA();
	expect(vi.mocked(pubsub.publish)).toHaveBeenCalledWith('twoFactor', { twoFactor: {
		remote: {
			enabled: true,
		},
		local: {
			enabled: true,
		},
	} });
	expect(vi.mocked(checkTwoFactorEnabled)).toBeCalledTimes(1);
});
