module.exports = function ($injector, glob, get, graphql, graphqlDirective, mergeGraphqlSchemas, ApiManager, log, typeDefs, resolvers, loadState, AppError) {
	const apiManager = new ApiManager();
	const { buildSchema } = graphql;
	const { addDirectiveResolveFunctionsToSchema } = graphqlDirective;
	const { mergeTypes } = mergeGraphqlSchemas;

	const types = mergeTypes([`
		scalar JSON
		scalar Long
		scalar UUID

		directive @func(
			module: String
			result: String
			extractFromResponse: String
		) on FIELD_DEFINITION

		directive @container on FIELD_DEFINITION

		type Mutation {
			login(username: String): String
		}

		type Query {
			me: User
			app(id: String!): App @func(module: "apps/app/get-app")
			apps: [App!]! @func(module: "get-apps", result:"json")
			device(id: String!): Device @func(module: "devices/device/get-device")
			devices: [Device!]! @func(module: "get-devices", result:"json")
			info: Info @container
			unassignedDevices: [UnassignedDevice] @func(module: "get-unassigned-devices", result:"json")
			user(id: String!): User @func(module: "users/user/get-user", result:"json")
			users: [User!]! @func(module: "get-users", result:"json")


			plugins: [Plugin] @func(module: "get-plugins", result:"json")
			service(name: String!): Service @func(module: "services/name/get-service", result:"json")
			services: [Service] @func(module: "get-services", result:"json")
			shares: [Share] @func(module: "get-shares", result:"json")
			vars: Vars @func(module: "get-vars", result:"json")
		}
	`, typeDefs]);

	const schema = buildSchema(types);

	addDirectiveResolveFunctionsToSchema(schema, {
		/**
		 * Container for nested queries
		 *
		 * @returns
		 */
		container() {
			return {};
		},
		/**
		 * Func
		 *
		 * @see https://github.com/smooth-code/graphql-directive/blob/master/README.md#directive-resolver-function-signature
		 *
		 * @param {promise} resolve A function that returns the result of the directive field.
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
		// eslint-disable-next-line max-params
		async func(resolve, obj, directiveArgs, context, info) {
			const path = $injector.resolve('path');
			const paths = $injector.resolve('paths');
			const { module: wantedModule, result: wantedResult } = directiveArgs;
			const coreCwd = path.join(paths.get('core'), 'modules');
			const funcPath = path.join(coreCwd, wantedModule);
			const { variableValues } = info;
			const args = info.fieldNodes.length >= 1 ? info.fieldNodes[0].arguments : [];

			// Create context params
			const params = args
				.map(param => {
					// Return string
					if (param.value.kind === 'StringValue') {
						return {
							[param.name.value]: param.value.value
						};
					}

					// Lookup value mapping
					return {
						[param.name.value]: variableValues[param.value.name.value]
					};
				})
				.reduce((current, next) => ({ ...current, ...next }), {});

			// Create func locals
			const locals = {
				context: {
					params
				}
			};

			// Resolve func
			const func = $injector.resolvePath(funcPath, locals);

			// Run function
			return Promise.resolve(func)
				.then(result => {
					// Get wanted result type
					result = result[wantedResult];

					// Allow fields to be extracted
					if (directiveArgs.extractFromResponse) {
						result = get(result, directiveArgs.extractFromResponse);
					}

					log.debug('Module: %s Result: %s', wantedModule, JSON.stringify(result, null, 2))
					return result;
				})
				.catch(error => {
					log.debug('Module: %s Error: %s', wantedModule, error.message);
					return error;
				});
		}
	});

	return {
		schema,
		types,
		resolvers,
		context: ({ req }) => {
			const token = req.headers['x-api-key'];
			let apiKey;

			if (!token) {
				throw new AppError('Missing apikey.');
			}

			if (apiManager.expired('my_servers')) {
				try {
					apiKey = loadState('/boot/config/plugins/dynamix/dynamix.cfg').remote.apikey;
				} catch (error) {
					throw new AppError('My servers api key is missing, did you register your server?');
				}

				apiManager.add('my_servers', apiKey);
			}

			if (!apiManager.isValid('my_servers', token)) {
				throw new AppError('Invalid apikey.');
			}
		}
	};
}