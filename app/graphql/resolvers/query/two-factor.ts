/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { generateTwoFactorToken, setTwoFactorToken } from '../../../common/two-factor';
import { ensurePermission } from '../../../core/utils/permissions/ensure-permission';
import { Context } from '../../schema/utils';

export default async (_: unknown, __: unknown, context: Context) => {
	ensurePermission(context.user, {
		resource: 'two-factor',
		action: 'read',
		possession: 'own'
	});

	// Generate new token
	const token = generateTwoFactorToken();

	// Save token to store
	setTwoFactorToken('root', token);

	// Return token
	return {
		token
	};
};
