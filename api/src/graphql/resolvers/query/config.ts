/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { ConfigErrorState, type QueryResolvers } from '@app/graphql/generated/api/types';
import { getters } from '@app/store';

export const config: QueryResolvers['config'] =  async (_, __, context) => {
	ensurePermission(context.user, {
		resource: 'config',
		action: 'read',
		possession: 'any',
	});

	const emhttp = getters.emhttp();

	return {
		valid: emhttp.var.configValid,
		error: emhttp.var.configValid ? null : ConfigErrorState[emhttp.var.configState] ?? ConfigErrorState.UNKNOWN_ERROR
	};
};
