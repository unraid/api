/*
 * Copyright 2019 Lime Technology Inc.  All rights reserved.
 * Written by: Alexis Tyler
 */

module.exports = function (
	$injector,
	ApiManager,
	AppError,
	get,
	gql,
	log,
	mergeGraphqlSchemas,
	PluginError,
	PluginManager,
	resolvers,
	typeDefs,
	Users,
	config
) {
	const {mergeTypes} = mergeGraphqlSchemas;
	const baseTypes = [gql`
		scalar JSON
		scalar Long
		scalar UUID

		directive @func(
			module: String
			data: JSON
			query: JSON
			result: String
			extractFromResponse: String
		) on FIELD_DEFINITION

		directive @subscription(
			channel: String!
		) on FIELD_DEFINITION

		type Welcome {
			message: String!
		}

		type Query {
			# This should always be available even for guest users
			welcome: Welcome! @func(module: "get-welcome")
			info: Info!
			pluginModule(plugin: String!, module: String!, params: JSON, result: String): JSON @func(result: "json")
		}

		type Mutation {
			login(username: String!, password: String!): String

			shutdown: String
			reboot: String
		}

		enum MutationType {
			CREATED
			UPDATED
			DELETED
		}

		enum UpdateOnlyMutationType {
			UPDATED
		}

		type PingSubscription {
			mutation: MutationType!
			node: String!
		}

		type InfoSubscription {
			mutation: MutationType!
			node: Info!
		}

		type PluginModuleSubscription {
			mutation: MutationType!
			node: JSON!
		}

		type Subscription {
			ping: PingSubscription!
			info: InfoSubscription!
			pluginModule(plugin: String!, module: String!, params: JSON, result: String): PluginModuleSubscription!
		}
	`];

	// Add test defs in dev mode
	if (process.env.NODE_ENV === 'development') {
		const testDefs = gql`
			# Test query
			input testQueryInput {
				state: String!
				optional: Boolean
			}
			type Query {
				testQuery(id: String!, input: testQueryInput): JSON @func(module: "debug/return-context")
			}

			# Test mutation
			input testMutationInput {
				state: String!
			}
			type Mutation {
				testMutation(id: String!, input: testMutationInput): JSON @func(module: "debug/get-context")
			}

			# Test subscription
			type Subscription {
				testSubscription: String!
			}
		`;
		baseTypes.push(testDefs);
	}

	// Add debug defs to all envs apart from production
	if (process.env.NODE_ENV !== 'production') {
		const debugDefs = gql`
			# Debug query
			type Context {
				query: JSON
				params: JSON
				data: JSON
				user: JSON
			}

			type Query {
				context: Context @func(module: "debug/get-context")
			}
		`;
		baseTypes.push(debugDefs);
	}

	const types = mergeTypes([
		...baseTypes,
		typeDefs
	]);

	const {SchemaDirectiveVisitor} = $injector.resolve('graphql-tools');

	/**
	 * Func directive
	 *
	 * @see https://github.com/smooth-code/graphql-directive/blob/master/README.md#directive-resolver-function-signature
	 *
	 * @param {object} obj
	 * The result returned from the resolver on the parent field, or, in the case of a top-level Query field,
	 * the rootValue passed from the server configuration.
	 * @param {object} directiveArgs
	 * An object with the arguments passed into the directive in the query or schema.
	 * For example, if the directive was called with `@dateFormat(format: "DD/MM/YYYY")`,
	 * the args object would be: `{ "format": "DD/MM/YYYY" }`.
	 * @param {object} context
	 * This is an object shared by all resolvers in a particular query,
	 * and is used to contain per-request state, including authentication information,
	 * dataloader instances, and anything else that should be taken into account when resolving the query.
	 * @param {object} info
	 * This argument should only be used in advanced cases,
	 * but it contains information about the execution state of the query,
	 * including the field name, path to the field from the root, and more.
	 */
	class FuncDirective extends SchemaDirectiveVisitor {
		visitFieldDefinition(field) {
			const {args} = this;
			field.resolve = function (source, directiveArgs, context, info) {
				const path = $injector.resolve('path');
				const paths = $injector.resolve('paths');
				const {module: moduleName, result: resultType} = args;
				const coreCwd = path.join(paths.get('core'), 'modules');
				const {plugin: pluginName, module: pluginModuleName, result: pluginType, input, ...params} = directiveArgs;
				const operationType = info.operation.operation;
				const query = {
					...directiveArgs.query,
					...(operationType === 'query' ? input : {})
				};
				const data = {
					...directiveArgs.data,
					...(operationType === 'mutation' ? input : {})
				};
				let funcPath = path.join(coreCwd, moduleName + '.js');

				// If we're looking for a plugin verify it's installed and active first
				if (pluginName) {
					if (!PluginManager.isInstalled(pluginName, pluginModuleName)) {
						throw new PluginError('Plugin not installed.');
					}

					if (!PluginManager.isActive(pluginName, pluginModuleName)) {
						throw new PluginError('Plugin disabled.');
					}

					const pluginModule = PluginManager.get(pluginName, pluginModuleName);
					// Update plugin funcPath
					funcPath = pluginModule.filePath;
				}

				// Create func locals
				// If query    @func(param_1, param_2, input: query?)
				// If mutation @func(param_1, param_2, input: data)
				const locals = {
					context: {
						query,
						params,
						data,
						user: context.user
					}
				};

				// Resolve func
				let func;
				try {
					func = $injector.resolvePath(funcPath, locals);
				} catch (error) {
					// Rethrow clean error message about module being missing
					if (error.code === 'MODULE_NOT_FOUND') {
						throw new AppError(`Cannot find ${pluginName ? 'Plugin: "' + pluginName + '" ' : ''}Module: "${pluginName ? pluginModuleName : moduleName}"`);
					}

					// In production let's just throw an internal error
					if (process.env.NODE_ENV === 'production') {
						throw new AppError('Internal error occured');
					}

					// Otherwise re-throw actual error
					throw error;
				}

				const pluginOrModule = pluginName ? 'Plugin:' : 'Module:';
				const pluginOrModuleName = pluginModuleName || moduleName;

				// Run function
				return Promise.resolve(func)
					.then(async result => {
						// If function's result is a function or promise run/resolve it
						result = await Promise.resolve(result).then(result => typeof result === 'function' ? result() : result);

						// Get wanted result type or fall back to json
						result = result[pluginType || resultType || 'json'];

						// Allow fields to be extracted
						if (directiveArgs.extractFromResponse) {
							result = get(result, directiveArgs.extractFromResponse);
						}

						log.debug(pluginOrModule, pluginOrModuleName, 'Result:', result);
						return result;
					})
					.catch(error => {
						// Ensure we aren't leaking anything in production
						if (process.env.NODE_ENV === 'production') {
							log.debug(pluginOrModule, pluginOrModuleName, 'Error:', error.message);
							return new Error(error.message);
						}

						const logger = log[error.status && error.status >= 400 ? 'error' : 'warn'];
						logger(pluginOrModule, pluginOrModuleName, 'Error:', error.message);
						return error;
					});
			};
		}
	}

	const {makeExecutableSchema} = $injector.resolve('graphql-tools');
	const schema = makeExecutableSchema({
		typeDefs: types,
		resolvers,
		schemaDirectives: {
			func: FuncDirective
		}
	});

	const ensureApiKey = apiKey => {
		if (!apiKey) {
			throw new AppError('Missing apikey.');
		}

		if (!ApiManager.isValid(apiKey)) {
			throw new AppError('Invalid apikey.');
		}
	};

	// Connected ws clients
	const clients = new Map();

	const {debug} = config;
	return {
		introspection: debug,
		playground: debug,
		schema,
		types,
		resolvers,
		subscriptions: {
			onConnect: (connectionParams, webSocket) => {
				const apiKey = connectionParams['x-api-key'];
				ensureApiKey(apiKey);

				const user = Users.findOne({apiKey}) || {name: 'guest', apiKey, role: 'guest'};

				log.debug(`<ws> ${user.name} connected.`);
				clients.set(webSocket, user);

				return {
					user
				};
			},
			onDisconnect: webSocket => {
				//				Const user = clients.get(webSocket);
				//				log.debug(`<ws> ${user.name} disconnected.`);
				//
				//				// If we don't wait a tick `user` becomes undefined.
				process.nextTick(() => {
					clients.delete(webSocket);

					$injector.registerValue('ws-clients', clients);
				});
			}
		},
		context: ({req, connection}) => {
			if (connection) {
				// Check connection for metadata
				return {
					...connection.context
				};
			}

			const apiKey = req.headers['x-api-key'];
			ensureApiKey(apiKey);

			const user = Users.findOne({apiKey}) || {name: 'guest', apiKey, role: 'guest'};

			return {
				user
			};
		}
	};
};
