/*
 * Copyright 2019 Lime Technology Inc.  All rights reserved.
 * Written by: Alexis Tyler
 */

module.exports = function (
	$injector,
	GraphQLJSON,
	GraphQLLong,
	GraphQLUUID,
	PluginManager,
	pubsub,
	log,
	PluginError,
	dee,
	debugTimer,
	bus,
	setIntervalAsync
) {
	// Only allows function to publish to pubsub when clients are online
	// the reason we do this is otherwise pubsub will cause a memory leak
	const canPublishToClients = () => {
		/**
		 * @type {Map}
		 */
		const wsClients = $injector.resolve('ws-clients?');

		// If there are no clients to broadcast to
		// then we might as well skip this run
		if (!wsClients || wsClients.size === 0) {
			return false;
		}

		return true;
	};

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
		if (!canPublishToClients()) {
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

	// Receive test messages.
	// pubsub.subscribe('ping', (...rest) => {
	// 	console.log(`CHANNEL: ping DATA: ${JSON.stringify(rest, null, 2)}`);
	// });

	// Update array values when disks change
	bus.on('disks', async () => {
		await run('array', 'UPDATED', {
			moduleToRun: 'get-array',
			context: {}
		});
	});

	const createBasicSubscription = name => ({
		subscribe: async () => {
			return pubsub.asyncIterator(name);
		}
	});

	// On Docker event update info with { apps: { installed, started } }
	const updatePubsub = async () => {
		if (!canPublishToClients()) {
			return;
		}

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

	dee.on('start', updatePubsub);
	dee.on('stop', updatePubsub);

	dee.listen();

	// Republish bus events to pubsub when clients connect
	// We need to filter to only the endpoint that're currently connected
	// bus.on('*', (...args) => {
	// 	if (!canPublishToClients()) {
	// 		return;
	// 	}

	// 	const {
	// 		[args.length - 1]: last,
	// 		...rest
	// 	} = args;

	// 	pubsub.publish(...Object.values(rest));
	// });

	// This needs to be fixed to run from events
	setIntervalAsync(async () => {
		if (!canPublishToClients()) {
			return;
		}

		await run('services', 'UPDATED', {
			moduleToRun: 'get-services'
		});
	}, 1000);

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
			ping: {
				subscribe: () => {
					startPing();
					return pubsub.asyncIterator('ping');
				}
			},
			services: {
				...createBasicSubscription('services')
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
				subscribe: async (_, directiveArgs) => {
					const {plugin: pluginName, module: pluginModuleName} = directiveArgs;
					const name = `${pluginName}/${pluginModuleName}`;

					// Verify plugin is installed and active
					if (!PluginManager.isInstalled(pluginName, pluginModuleName)) {
						throw new PluginError('Plugin not installed.');
					}

					if (!PluginManager.isActive(pluginName, pluginModuleName)) {
						throw new PluginError('Plugin disabled.');
					}

					// It's up to the plugin to publish new data as needed
					// so we'll just return the Iterator
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
