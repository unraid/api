/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { type Context } from '@app/graphql/schema/utils';
import { graphqlLogger } from '@app/core';
import { GraphQLClient } from '@app/mothership/graphql-client';
import { SEND_NOTIFICATION_MUTATION } from '../../mothership/mutations';
import { getters } from '../../../store';
import { type NotificationInput } from '../../generated/client/graphql';

export const sendNotification = async (_: unknown, args: { notification: NotificationInput }, context: Context) => {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'notifications',
		action: 'create',
		possession: 'own',
	});

	// If there's no mothership connection then bail
	if (!GraphQLClient.getInstance()) {
		graphqlLogger.error('Mothership is not working');
		throw new Error('Mothership is down');
	}

	const result = await GraphQLClient.getInstance().query({ query: SEND_NOTIFICATION_MUTATION, variables: {
		notification: args.notification,
		apiKey: getters.config().remote.apikey,
	} });
	graphqlLogger.debug('Query Result from Notifications.ts', result);
};
