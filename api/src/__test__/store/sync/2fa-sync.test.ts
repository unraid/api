import { test, expect, vi } from 'vitest';

// Preloading imports for faster tests
import '@app/store/sync/2fa-sync';
import '@app/common/two-factor';
import '@app/core/pubsub';

vi.mock('@app/common/two-factor', () => ({
	checkTwoFactorEnabled: vi.fn(() => ({ isLocalEnabled: true, isRemoteEnabled: true })),
}));

vi.mock('@app/core/pubsub', () => ({
	pubsub: { publish: vi.fn() },
}));

test('sync 2fa', async () => {
	const { sync2FA } = await import('@app/store/sync/2fa-sync');
	const { checkTwoFactorEnabled } = await import('@app/common/two-factor');
	const { pubsub } = await import('@app/core/pubsub');

	// Force 2FA sync
	await sync2FA();

	expect(vi.mocked(pubsub.publish)).toHaveBeenCalledWith('twoFactor', {
		twoFactor: {
			remote: {
				enabled: true,
			},
			local: {
				enabled: true,
			},
		},
	});
	expect(vi.mocked(checkTwoFactorEnabled)).toBeCalledTimes(1);
});
