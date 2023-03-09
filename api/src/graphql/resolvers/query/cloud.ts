/*!
 * Copyright 2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { getAllowedOrigins } from '@app/common/allowed-origins';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { checkApi } from '@app/graphql/resolvers/query/cloud/check-api';
import { checkCloud } from '@app/graphql/resolvers/query/cloud/check-cloud';
import { checkMinigraphql } from '@app/graphql/resolvers/query/cloud/check-minigraphql';
import type { Context } from '@app/graphql/schema/utils';
import { type QueryResolvers } from '@app/graphql/generated/api/types';

const cloudResolver: QueryResolvers['cloud'] = async (parent, args, context: Context) => {
	ensurePermission(context.user, {
		resource: 'cloud',
		action: 'read',
		possession: 'own',
	});
	const minigraphql = checkMinigraphql();
	const [apiKey, cloud] = await Promise.all([checkApi(), checkCloud()]);

	return {
		relay: { // Left in for UPC backwards compat.
			error: undefined,
			status: 'connected',
			timeout: null,
		},
		apiKey,
		minigraphql,
		cloud,
		allowedOrigins: getAllowedOrigins(),
		error: `${apiKey.error ? `API KEY: ${apiKey.error}` : ''}${cloud.error ? `NETWORK: ${cloud.error}` : ''}${minigraphql.error ? `CLOUD: ${minigraphql.error}` : ''}` || null,
	};
};

export default cloudResolver;
