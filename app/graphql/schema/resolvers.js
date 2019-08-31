/*
 * Copyright 2019 Lime Technology Inc.  All rights reserved.
 * Written by: Alexis Tyler
 */

module.exports = function ($injector, GraphQLJSON, GraphQLLong, GraphQLUUID, pubsub, setIntervalAsync, PluginManager, log, fromEntries, asyncMap, delay) {
	const publish = (channel, mutation, {
		node = undefined,
		moduleToRun = undefined,
		filePath,
		interval = 1000,
		total = 1,
		forever = false
	}) => {
		const createTimer = () => {
			const timer = setIntervalAsync(async () => {
				if (!moduleToRun && !filePath) {
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
					let result = await (filePath ? $injector.resolvePath(filePath) : $injector.resolveModule(`module:${moduleToRun}`));

					// Run resolved function if it returns one.
					if (typeof result === 'function') {
						result = result();
					}

					if (filePath) {
						const [pluginName, moduleName] = channel.split('/');
						log.debug('Plugin:', pluginName, 'Module:', moduleName, 'Result:', result);
					} else {
						log.debug('Module:', channel, 'Result:', result);
					}

					// Update "node"
					pubsub.publish(channel, {
						[filePath ? 'pluginModule' : channel]: {
							mutation,
							node: result.json
						}
					});
				} catch (error) {
					// Ensure we aren't leaking anything in production
					if (process.env.NODE_ENV === 'production') {
						log.debug('Error:', error.message);
					}

					const logger = log[error.status && error.status >= 400 ? 'error' : 'warn'];
					logger('Error:', error.message);

					clearInterval(timer);
				}
			}, interval);

			return timer;
		};

		const alreadyRunning = (filePath && $injector._graph[`timer:${filePath}`]) || (moduleToRun && $injector._graph[`timer:${moduleToRun}`]);

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
				$injector.registerValue(`timer:${filePath || moduleToRun}`, timer);
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

	const createBasicSubscription = (name, moduleToRun) => {
		return {
			subscribe: () => {
				publish(name, 'UPDATED', {
					moduleToRun,
					forever: true
				});
				return pubsub.asyncIterator(name);
			}
		}
	};

	return {
		Query: {
			info: () => ({}),
			vms: () => ({})
		},
		Subscription: {
			apikeys: {
				subscribe: () => {
					// Not sure how we're going to secure this
					return pubsub.asyncIterator('apikeys');
				}
			},
			array: {
				...createBasicSubscription('array', 'get-array')
			},
			devices: {
				...createBasicSubscription('devices', 'get-devices')
			},
			dockerContainers: {
				...createBasicSubscription('docker/containers', 'docker/get-containers')
			},
			dockerNetworks: {
				...createBasicSubscription('docker/networks', 'docker/get-networks')
			},
			info: {
				subscribe: () => pubsub.asyncIterator('info'),
				close() {
					console.debug('Clearing info subscription timers');

					// Clear all info subscription timers
					Object.entries($injector._graph).filter(([ name ]) => {
						return name.startsWith('timer:info');
					}).map(([name, timer]) => {
						console.debug(`Clearing ${name} subscription timer`);
						clearInterval(timer);
					});
				}
				// subscribe: async () => {
				// 	const infoFields = [
				// 		'apps',
				// 		'cpu',
				// 		'devices',
				// 		'display',
				// 		'os',
				// 		'versions'
				// 	];

				// 	const infoModules = infoFields.map(field => [field, $injector.resolveModule(`module:info/get-${field}`)]);
				// 	let run = 0;

				// 	return {
				// 		async next() {
				// 			// Await each field to get new value
				// 			const values = fromEntries(await asyncMap(infoModules, async ([field, _module]) => {
				// 				return [field, await _module.then(result => result.json)];
				// 			}));
							
				// 			const result = {
				// 				value: {
				// 					info: {
				// 						mutation: 'UPDATED',
				// 						node: {
				// 							...values
				// 						}
				// 					}
				// 				},
				// 				done: false
				// 			};

				// 			run = run + 1;
				// 			console.log(`Run ${run}, ${Object.keys(values)}`);
				// 			// Kill after 10
				// 			if (run >= 10) {
				// 				return { value: null, done: true };
				// 			}
				// 			return result;
				// 		},
				// 		[Symbol.asyncIterator]() {
				// 			return this;
				// 		}
				// 	};
				// }
			},
			me: {
				subscribe: withFilter(() => pubsub.asyncIterator('user'), (payload, _, context) => payload.user.node.id === context.user.id),
				resolve: payload => payload.user
			},
			ping: {
				subscribe: () => {
					startPing();
					return pubsub.asyncIterator('ping');
				}
			},
			services: {
				...createBasicSubscription('services', 'get-services')
			},
			shares: {
				...createBasicSubscription('shares', 'get-shares')
			},
			unassignedDevices: {
				...createBasicSubscription('devices/unassigned', 'get-unassigned-devices')
			},
			users: {
				...createBasicSubscription('users', 'get-users')
			},
			vars: {
				...createBasicSubscription('vars', 'get-vars')
			},
			vms: {
				...createBasicSubscription('vms/domains', 'vms/get-domains')
			},
			pluginModule: {
				subscribe: (rootValue, directiveArgs, context, info) => {
					const { plugin: pluginName, module: pluginModuleName } = directiveArgs;
					const name = `${pluginName}/${pluginModuleName}`;

					// Verify plugin is installed and active
					if (!PluginManager.isInstalled(pluginName, pluginModuleName)) {
						throw new PluginError('Plugin not installed.');
					}
					if (!PluginManager.isActive(pluginName, pluginModuleName)) {
						throw new PluginError('Plugin disabled.');
					}

					const filePath = PluginManager.get(pluginName, pluginModuleName).filePath;

					publish(name, 'UPDATED', {
						filePath,
						forever: true
					});
					return pubsub.asyncIterator(name);
				}
			}
		},
		JSON: GraphQLJSON,
		Long: GraphQLLong,
		UUID: GraphQLUUID,
		UserAccount: {
			__resolveType(obj, context, info) {
				// Only a user has a password field, the current user aka "me" doesn't.
				if (obj.password) {
					return 'User';
				}

				return 'Me';
			}
		}
	};
};