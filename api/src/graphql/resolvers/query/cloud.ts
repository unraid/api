/*!
 * Copyright 2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { getAllowedOrigins } from '@app/common/allowed-origins';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { checkApi } from '@app/graphql/resolvers/query/cloud/check-api';
import { checkCloud } from '@app/graphql/resolvers/query/cloud/check-cloud';
import { checkMinigraphql } from '@app/graphql/resolvers/query/cloud/check-minigraphql';
import { Cloud, createResponse } from '@app/graphql/resolvers/query/cloud/create-response';
import type { Context } from '@app/graphql/schema/utils';
import { getters } from '@app/store';

export default async (_: unknown, __: unknown, context: Context): Promise<Cloud> => {
	ensurePermission(context.user, {
		resource: 'cloud',
		action: 'read',
		possession: 'own',
	});

	// If the endpoint is mocked return the mocked data
	if (process.env.MOCK_CLOUD_ENDPOINT) {
		const result: Cloud = {
			error: process.env.MOCK_CLOUD_ENDPOINT_ERROR ?? null,
			apiKey: {
				valid: Boolean(process.env.MOCK_CLOUD_ENDPOINT_APIKEY_VALID ?? true),
				error: process.env.MOCK_CLOUD_ENDPOINT_APIKEY_ERROR ?? null,
			} as unknown as Cloud['apiKey'],
			minigraphql: {
				status: process.env.MOCK_CLOUD_ENDPOINT_MINIGRAPHQL_CONNECTED as 'connected' | 'disconnected',
			},
			cloud: {
				status: process.env.MOCK_CLOUD_ENDPOINT_MOTHERSHIP_STATUS as 'ok' | 'error' ?? 'ok',
				error: process.env.MOCK_CLOUD_ENDPOINT_MOTHERSHIP_ERROR ?? null,
				ip: process.env.MOCK_CLOUD_ENDPOINT_MOTHERSHIP_IP,
			} as unknown as Cloud['cloud'],
			allowedOrigins: (process.env.MOCK_CLOUD_ENDPOINT_ALLOWED_ORIGINS ?? '').split(',').filter(Boolean),
			emhttp: {
				mode: 'nchan',
			},
		};
		return result;
	}

	const [apiKey, minigraphql, cloud] = await Promise.all([checkApi(), checkMinigraphql(), checkCloud()]);

	const response = createResponse({
		apiKey,
		minigraphql,
		cloud,
		allowedOrigins: getAllowedOrigins(),
		emhttp: {
			mode: getters.emhttp().mode,
		},
	});

	return response;
};
