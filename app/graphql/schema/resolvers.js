/*
 * Copyright 2019 Lime Technology Inc.  All rights reserved.
 * Written by: Alexis Tyler
 */

module.exports = function ($injector, GraphQLJSON, GraphQLLong, GraphQLUUID, pubsub, setIntervalAsync) {
	const publish = (channel, mutation, {
		node = undefined,
		moduleToRun = undefined,
		interval = 1000,
		total = 1,
		forever = false
	}) => {
		const createTimer = () => {
			const timer = setIntervalAsync(async () => {
				if (!moduleToRun) {
					pubsub.publish(channel, {
						[channel]: {
							mutation,
							node
						}
					});

					return;
				}

				try {
					// Run module
					const result = await $injector.resolveModule(`module:${moduleToRun}`);

					// Update "node"
					pubsub.publish(channel, {
						[channel]: {
							mutation,
							node: result.json
						}
					});
				} catch (error) {
					console.error(error);
					clearInterval(timer);
				}
			}, interval);

			return timer;
		};

		const alreadyRunning = moduleToRun && $injector._graph[`timer:${moduleToRun}`] !== undefined;

		if (!alreadyRunning) {
			const timer = createTimer();

			// Clear timer eventually
			if (!forever) {
				setTimeout(() => {
					clearInterval(timer);
				}, interval * total);
			}

			// Save timer incase we need to clear it later
			// For example when all users disconnect from the server
			if (forever) {
				$injector.registerValue(`timer:${moduleToRun}`, timer);
			}
		}
	};

	// Send test message every 1 second for 10 seconds.
	const startPing = (interval = 1000, total = 10) => {
		publish('ping', 'UPDATED', {
			node: 'PONG!',
			interval,
			total
		});
	};

	// Recieve test messages.
	// pubsub.subscribe('ping', (...rest) => {
	// 	console.log(`CHANNEL: ping DATA: ${JSON.stringify(rest, null, 2)}`);
	// });

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
				subscribe: () => {
					publish('services', 'UPDATED', {
						moduleToRun: 'get-services',
						forever: true
					})
					return pubsub.asyncIterator('services');
				}
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
			},
			array: {
				subscribe: () => {
					publish('array', 'UPDATED', {
						moduleToRun: 'get-array',
						forever: true
					})
					return pubsub.asyncIterator('array');
				}
			}
		},
		JSON: GraphQLJSON,
		Long: GraphQLLong,
		UUID: GraphQLUUID
	};
};