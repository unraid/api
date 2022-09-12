/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { pubsub } from '@app/core/pubsub';
import { bus } from '@app/core/bus';
import { checkTwoFactorEnabled } from '@app/common/two-factor';
import { Var } from '@app/core/types/states/var';
import { logger } from '@app/core/log';

export const twoFactor = () => {
	let useSSL;
	const listener = async (data: Var) => {
		// If the setting hasn't changed just bail
		if (useSSL === data.useSsl) return;

		logger.debug('Checking 2FA status as var state has changed');

		// If useSSL is not set then set it
		if (useSSL !== data.useSsl) {
			useSSL = data.useSsl;
		}

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

	return {
		start() {
			// Update twoFactor when useSSL changes
			bus.on('var', listener);
		},
		stop() {
			bus.removeListener('var', listener);
		},
	};
};
