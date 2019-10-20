/*
 * Copyright 2019 Lime Technology Inc.  All rights reserved.
 * Written by: Alexis Tyler
 */

module.exports = function ($injector, GraphQLJSON, GraphQLLong, GraphQLUUID, pubsub, PluginManager, log, PluginError, dee, Bottleneck, sleep, debugTimer) {
	// Once per second
	const limiter = new Bottleneck({
		minTime: 1
	});

	const handleResult = async possibleResult => {
		// Await resolved function if it returns one.
		if (typeof possibleResult === 'function') {
			const result = await possibleResult();
			return result;
		}

		return possibleResult;
	};

	/**
	 * Run a module and update pubsub
	 *
	 * @param {String} channel
	 * @param {String} mutation
	 * @param {Object} options
	 * @param {String} [options.node]
	 * @param {String} [options.moduleToRun]
	 * @param {String} [options.filePath]
	 * @param {Number} [options.interval = 1000]
	 * @param {Number} [options.total = 1]
	 * @param {Object} [options.context = {}]
	 */
	const run = async (channel, mutation, {
		node,
		moduleToRun,
		filePath,
		context = {}
	}) => {
		/**
		 * @type {Map}
		 */
		const wsClients = $injector.resolve('ws-clients?');

		// If there are no clients to broadcast to
		// then we might as well skip this run
		if (wsClients && wsClients.size === 0) {
			return;
		}

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
			const result = await new Promise(resolve => {
				if (filePath) {
					debugTimer(`run:${filePath}`);
					const promise = $injector.resolvePath(filePath, {
						context
					});

					return resolve(promise);
				}

				debugTimer(`run:${moduleToRun}`);
				const promise = $injector.resolveModule(`module:${moduleToRun}`, {
					context
				});

				return resolve(promise);
			}).then(handleResult);

			if (filePath) {
				const [pluginName, moduleName] = channel.split('/');
				log.debug('Plugin:', pluginName, 'Module:', moduleName, 'Result:', result);
			} else {
				log.debug('Module:', channel, 'Result:', result.json);
			}

			// Update pubsub channel
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
			} else {
				const logger = log[error.status && error.status >= 400 ? 'error' : 'warn'];
				logger('Error:', error.message);
			}
		}

		debugTimer(filePath ? `run:${filePath}` : `run:${moduleToRun}`);
	};

	// Send test message every 1 second for 10 seconds.
	const startPing = async (interval = 1000, total = 10) => {
		await run('ping', 'UPDATED', {
			node: 'PONG!',
			interval,
			total
		});
	};

	// Recieve test messages.
	// pubsub.subscribe('ping', (...rest) => {
	// 	console.log(`CHANNEL: ping DATA: ${JSON.stringify(rest, null, 2)}`);
	// });

	const processDisks = async () => {
		await run('array', 'UPDATED', {
			moduleToRun: 'get-array',
			context: {}
		});
	};

	pubsub.subscribe('disks', limiter.wrap(processDisks));

	const {withFilter} = $injector.resolve('graphql-subscriptions');

	const createBasicSubscription = name => ({
		subscribe: async () => {
			return pubsub.asyncIterator(name);
		}
	});

	// On Docker event update info with { apps: { installed, started } }
	const updateIterator = async () => {
		const {json} = await $injector.resolveModule('module:info/get-apps');
		pubsub.publish('info', {
			info: {
				mutation: 'UPDATED',
				node: {
					...json
				}
			}
		});
	};

	dee.on('start', updateIterator);
	dee.on('stop', updateIterator);

	dee.listen();

	return {
		Query: {
			info: () => ({}),
			vms: () => ({})
		},
		Subscription: {
			apikeys: {
				// Not sure how we're going to secure this
				...createBasicSubscription('apikeys')
			},
			array: {
				...createBasicSubscription('array')
			},
			devices: {
				...createBasicSubscription('devices')
			},
			dockerContainers: {
				...createBasicSubscription('docker/containers')
			},
			dockerNetworks: {
				...createBasicSubscription('docker/networks')
			},
			info: {
				...createBasicSubscription('info')
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
				// ...createBasicSubscription('services', 'get-services')
				subscribe: () => {
					// This needs to be fixed to run from events
					setInterval(limiter.wrap(async () => {
						await run('services', 'UPDATED', {
							moduleToRun: 'get-services'
						});
					}), 500);
					return pubsub.asyncIterator('services');
				}
			},
			shares: {
				...createBasicSubscription('shares')
			},
			unassignedDevices: {
				...createBasicSubscription('devices/unassigned')
			},
			users: {
				...createBasicSubscription('users')
			},
			vars: {
				...createBasicSubscription('vars')
			},
			vms: {
				...createBasicSubscription('vms/domains')
			},
			pluginModule: {
				subscribe: async (rootValue, directiveArgs) => {
					const {plugin: pluginName, module: pluginModuleName} = directiveArgs;
					const name = `${pluginName}/${pluginModuleName}`;

					// Verify plugin is installed and active
					if (!PluginManager.isInstalled(pluginName, pluginModuleName)) {
						throw new PluginError('Plugin not installed.');
					}

					if (!PluginManager.isActive(pluginName, pluginModuleName)) {
						throw new PluginError('Plugin disabled.');
					}

					const {filePath} = PluginManager.get(pluginName, pluginModuleName);

					// Ensure we start the run after we return
					process.nextTick(() => {
						run(name, 'UPDATED', {
							filePath
						});
					});

					return pubsub.asyncIterator(name);
				}
			}
		},
		JSON: GraphQLJSON,
		Long: GraphQLLong,
		UUID: GraphQLUUID,
		UserAccount: {
			__resolveType(obj) {
				// Only a user has a password field, the current user aka "me" doesn't.
				if (obj.password) {
					return 'User';
				}

				return 'Me';
			}
		}
	};
};
