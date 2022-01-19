/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { generateTwoFactorToken, setTwoFactorToken } from '../../../common/two-factor';
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

	// Check if 2fa is enabled
	// null is the same as auto
	const isSSLAuto = varState.data.useSsl === null;
	const isRemoteEnabled = myServersConfig.remote?.['2Fa'] === 'yes';
	const isLocalEnabled = myServersConfig.local?.['2Fa'] === 'yes';
	const isEnabled = isSSLAuto && (isRemoteEnabled || isLocalEnabled);

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
