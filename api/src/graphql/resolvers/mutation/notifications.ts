/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { graphqlLogger } from '@app/core';
import { GraphQLClient } from '@app/mothership/graphql-client';
import { SEND_NOTIFICATION_MUTATION } from '@app/graphql/mothership/mutations';
import { getters } from '@app/store';
import { type Resolvers } from '@app/graphql/generated/api/types';

export const sendNotification: NonNullable<Resolvers['Mutation']>['sendNotification'] = async (_, args: { notification }, context) => {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'notifications',
		action: 'create',
		possession: 'own',
	});

	const client = GraphQLClient.getInstance();
	// If there's no mothership connection then bail
	if (!client) {
		graphqlLogger.error('Mothership is not working');
		throw new Error('Mothership is down');
	}
	const result = await client.query({ 
		query: SEND_NOTIFICATION_MUTATION, 
		variables: {
			notification: args.notification,
			apiKey: getters.config().remote.apikey,
		}
	});
	graphqlLogger.debug('Query Result from Notifications.ts', result);
	return args.notification;
};
