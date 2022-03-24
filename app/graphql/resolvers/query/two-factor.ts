/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { generateTwoFactorToken, checkTwoFactorEnabled, setTwoFactorToken } from '../../../common/two-factor';
import { compareUnraidVersion } from '../../../common/unraid-version-compare';
import { logger } from '../../../core/log';
import { varState } from '../../../core/states';
import { ensurePermission } from '../../../core/utils/permissions/ensure-permission';
import { myServersConfig } from '../../../core/watchers/myservers';
import { Context } from '../../schema/utils';

export default async (_: unknown, __: unknown, context: Context) => {
	ensurePermission(context.user, {
		resource: 'two-factor',
		action: 'read',
		possession: 'own'
	});

	logger.debug('Generating 2FA response');

	const { isEnabled, isRemoteEnabled, isLocalEnabled } = checkTwoFactorEnabled();

	// Bail if it's not enabled
	if (!isEnabled) {
		// Return token
		return {
			token: null,
			remote: {
				enabled: isRemoteEnabled
			},
			local: {
				enabled: isLocalEnabled
			}
		};
	}

	// Generate new token
	const token = generateTwoFactorToken();

	// Save token to store
	setTwoFactorToken('root', token);

	// Return token
	return {
		token,
		remote: {
			enabled: isRemoteEnabled
		},
		local: {
			enabled: isLocalEnabled
		}
	};
};
