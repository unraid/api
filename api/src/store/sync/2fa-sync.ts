import { checkTwoFactorEnabled } from '@app/common/two-factor';
import { pubsub } from '@app/core/pubsub';

export const sync2FA = async () => {
	const { isRemoteEnabled, isLocalEnabled } = checkTwoFactorEnabled();

	// Publish to 2fa endpoint
	await pubsub.publish('twoFactor', {
		twoFactor: {
			remote: {
				enabled: isRemoteEnabled,
			},
			local: {
				enabled: isLocalEnabled,
			},
		},
	});
};
