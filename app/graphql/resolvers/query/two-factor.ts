/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { generateTwoFactorToken } from '../../../common/two-factor';
import { ensurePermission } from '../../../core/utils/permissions/ensure-permission';
import { Context } from '../../schema/utils';

export default async (_: unknown, __: unknown, context: Context) => {
	ensurePermission(context.user, {
		resource: 'two-factor',
		action: 'read',
		possession: 'own'
	});

	// Return code
	return generateTwoFactorToken();
};
