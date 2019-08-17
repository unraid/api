/*
 * Copyright 2019 Lime Technology Inc.  All rights reserved.
 * Written by: Alexis Tyler
 */

module.exports = function (GraphQLJSON, GraphQLLong, GraphQLUUID, pubsub) {

	// Send test message every 1 second for 10 seconds.
	const startPing = (interval, length) => {
		const _interval = setInterval(() => {
			pubsub.publish('ping', { ping: 'PONG' });
		}, interval);

		setTimeout(() => {
			clearInterval(_interval);
		}, length);
	};

	// // Recieve test messages.
	// pubsub.subscribe('ping', (...rest) => {
	// 	console.log(`CHANNEL: ping DATA: ${JSON.stringify(rest, null, 2)}`);
	// })

	return {
		Subscription: {
			ping: {
				subscribe: () => {
					startPing();
					return pubsub.asyncIterator('ping');
				}
			},
			welcome: {
				subscribe: () => pubsub.asyncIterator('welcome')
			},
			services: {
				subscribe: () => pubsub.asyncIterator('services')
			}
		},
		JSON: GraphQLJSON,
		Long: GraphQLLong,
		UUID: GraphQLUUID
	};
};