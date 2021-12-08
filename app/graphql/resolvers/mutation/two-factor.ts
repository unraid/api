/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { ensurePermission } from '../../../core/utils';
import { Context } from '../../schema/utils';

export const twoFactor = async (_: unknown, args: { token: string }, context: Context) => {
	// Check permissions
	ensurePermission(context.user, {
		resource: 'two-factor',
		action: 'read',
		possession: 'own'
	});

    if ()
};
