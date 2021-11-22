/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { ensurePermission } from '../../../core/utils';
import { mothership } from '../../../mothership/subscribe-to-servers';
import { Context } from '../../schema/utils';

export const sendNotification = async (_: unknown, args: { notification: Notification }, context: Context) => {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'notifications',
		action: 'create',
		possession: 'own'
	});

	// If there's no mothership connection then bail
	if (!mothership) {
		throw new Error('Mothership is down');
	}

	// Prepare query
	const query = mothership.request({
		query: 'mutation($notification:NotificationInput!){sendNotification(notification:$notification){title subject description importance link status}}',
		variables: {
			notification: args.notification
		}
	});

	// Send notification to mothership
	query.subscribe({
		next: async ({ data, errors }) => {
			if (!errors || errors.length === 0) {
				return;
			}

			console.log('FAILED_SENDING_NOTIFICATION', errors);
		}
	});
};
