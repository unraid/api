/*!
 * Copyright 2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { getAllowedOrigins } from '@app/common/allowed-origins';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { RelayStates } from '@app/graphql/relay-state';
import { checkApi } from '@app/graphql/resolvers/query/cloud/check-api';
import { checkCloud } from '@app/graphql/resolvers/query/cloud/check-cloud';
import { checkMinigraphql } from '@app/graphql/resolvers/query/cloud/check-minigraphql';
import { checkRelay } from '@app/graphql/resolvers/query/cloud/check-relay';
import { Cloud, createResponse } from '@app/graphql/resolvers/query/cloud/create-response';
import type { Context } from '@app/graphql/schema/utils';

export default async (_: unknown, __: unknown, context: Context): Promise<Cloud> => {
	ensurePermission(context.user, {
		resource: 'cloud',
		action: 'read',
		possession: 'own',
	});

	// If the endpoint is mocked return the mocked data
	if (process.env.MOCK_CLOUD_ENDPOINT) {
		const result: Cloud = {
			error: process.env.MOCK_CLOUD_ENDPOINT_ERROR,
			apiKey: {
				valid: Boolean(process.env.MOCK_CLOUD_ENDPOINT_APIKEY_VALID ?? true),
				error: process.env.MOCK_CLOUD_ENDPOINT_APIKEY_ERROR,
			} as unknown as Cloud['apiKey'],
			relay: {
				status: process.env.MOCK_CLOUD_ENDPOINT_RELAY_STATUS as RelayStates ?? 'connected',
				timeout: process.env.MOCK_CLOUD_ENDPOINT_RELAY_TIMEOUT ? Number(process.env.MOCK_CLOUD_ENDPOINT_RELAY_TIMEOUT) : undefined,
				reason: process.env.MOCK_CLOUD_ENDPOINT_RELAY_REASON,
				error: process.env.MOCK_CLOUD_ENDPOINT_RELAY_ERROR,
			} as unknown as Cloud['relay'],
			minigraphql: {
				status: process.env.MOCK_CLOUD_ENDPOINT_MINIGRAPHQL_CONNECTED as 'connected' | 'disconnected',
			},
			cloud: {
				status: process.env.MOCK_CLOUD_ENDPOINT_MOTHERSHIP_STATUS as 'ok' | 'error' ?? 'ok',
				error: process.env.MOCK_CLOUD_ENDPOINT_MOTHERSHIP_ERROR,
				ip: process.env.MOCK_CLOUD_ENDPOINT_MOTHERSHIP_IP,
			} as unknown as Cloud['cloud'],
			allowedOrigins: (process.env.MOCK_CLOUD_ENDPOINT_ALLOWED_ORIGINS ?? '').split(',').filter(Boolean),
		};
		return result;
	}

	const [apiKey, minigraphql, cloud] = await Promise.all([checkApi(), checkMinigraphql(), checkCloud()]);

	const response = createResponse({
		apiKey,
		relay: checkRelay(),
		minigraphql,
		cloud,
		allowedOrigins: getAllowedOrigins(),
	});

	return response;
};
