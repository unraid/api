/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import type { Context } from '@app/graphql/schema/utils';
import { getServers } from '@app/graphql/schema/utils';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { type Resolvers } from '../../generated/api/types';

export const servers: NonNullable<Resolvers['Query']>['servers'] = async (_, __, context) => {
	ensurePermission(context.user, {
		resource: 'servers',
		action: 'read',
		possession: 'any',
	});

	// All servers
	return getServers();
};
