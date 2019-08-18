/*
 * Copyright 2019 Lime Technology Inc.  All rights reserved.
 * Written by: Alexis Tyler
 */

module.exports = function ($injector, GraphQLJSON, GraphQLLong, GraphQLUUID, pubsub) {
	// Send test message every 1 second for 10 seconds.
	const startPing = (interval = 1000, length = 10000) => {
		const _interval = setInterval(() => {
			pubsub.publish('ping', {
				ping: {
					mutation: 'UPDATED',
					node: 'PONG'
				}
			});
		}, interval);

		setTimeout(() => {
			clearInterval(_interval);
		}, length);
	};

	// // Recieve test messages.
	// pubsub.subscribe('me', (...rest) => {
	// 	console.log(`CHANNEL: users DATA: ${JSON.stringify(rest, null, 2)}`);
	// })

	const { withFilter } = $injector.resolve('graphql-subscriptions');

	return {
		Query: {
			info: () => ({}),
			vms: () => ({})
		},
		Subscription: {
			ping: {
				subscribe: () => {
					startPing();
					return pubsub.asyncIterator('ping');
				}
			},
			services: {
				subscribe: () => pubsub.asyncIterator('services')
			},
			user: {
				subscribe: () => pubsub.asyncIterator('user')
			},
			users: {
				subscribe: () => pubsub.asyncIterator('users')
			},
			me: {
				subscribe: withFilter(() => pubsub.asyncIterator('user'), (payload, _, context) => payload.user.node.id === context.user.id),
				resolve: payload => payload.user
			},
			info: {
				subscribe: () => pubsub.asyncIterator('info')
			}
		},
		JSON: GraphQLJSON,
		Long: GraphQLLong,
		UUID: GraphQLUUID
	};
};