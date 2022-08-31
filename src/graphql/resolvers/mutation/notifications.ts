/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';;
import { Context } from '@app/graphql/schema/utils';
import { graphqlLogger} from "@app/core"
import { MinigraphClient } from '@app/mothership/minigraph-client';

export const sendNotification = async (_: unknown, args: { notification: Notification }, context: Context) => {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'notifications',
		action: 'create',
		possession: 'own',
	});

	// If there's no mothership connection then bail
	if (!MinigraphClient.getClient()) {
		graphqlLogger.error('Mothership is not working')
		throw new Error('Mothership is down');
	}

	// Prepare query
	const query = {
		query: 'mutation($notification:NotificationInput!){sendNotification(notification:$notification){title subject description importance link status}}',
		variables: {
			notification: args.notification,
		},
	};

	const result = await MinigraphClient.query(query)
	graphqlLogger.debug('Query Result from Notifications.ts', result)
};
