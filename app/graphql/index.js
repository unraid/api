/*
 * Copyright 2005-2019, Lime Technology
 * Copyright 2018-2019, Alexis Tyler
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License version 2,
 * as published by the Free Software Foundation.
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 */

module.exports = function ($injector, get, graphql, graphqlDirective, mergeGraphqlSchemas, ApiManager, log, typeDefs, resolvers, AppError, PluginManager, PluginError) {
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
			pluginModule(plugin: String!, module: String!, params: JSON, result: String): JSON @func(result:"json")
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
			const createContextParams = args => args.map(param => {
				// Lookup value mapping
				if (param.value.kind === 'Variable') {
					return {
						[param.name.value]: info.variableValues[param.value.name.value]
					};
				}

				// Return value
				return {
					[param.name.value]: param.value.value
				};
			})
				.reduce((current, next) => ({ ...current, ...next }), {});
			const args = info.fieldNodes.length >= 1 ? info.fieldNodes[0].arguments : [];
			const { module: moduleName, result: resultType } = directiveArgs;
			const coreCwd = path.join(paths.get('core'), 'modules');
			const params = createContextParams(args);
			const { plugin: pluginName, module: pluginModuleName, result: pluginType, ...rest } = params;
			let contextParams = params;
			let funcPath = path.join(coreCwd, moduleName + '.js');

			// If we're looking for a plugin verifiy it's installed and active first
			if (params.plugin) {
				if (!PluginManager.isInstalled(pluginName, pluginModuleName)) {
					throw new PluginError('Plugin not installed.');
				}
				if (!PluginManager.isActive(pluginName, pluginModuleName)) {
					throw new PluginError('Plugin disabled.');
				}

				const pluginModule = PluginManager.get(pluginName, pluginModuleName);
				// Update plugin module params and funcPath
				contextParams = rest.params || {};
				funcPath = pluginModule.filePath;
			}

			// Create func locals
			const locals = {
				context: {
					params: contextParams
				}
			};

			// Resolve func
			let func;
			try {
				func = $injector.resolvePath(funcPath, locals);
			} catch (error) {
				throw new AppError(`Cannot find ${pluginName ? 'Plugin: "' + pluginName + '" ' : ''}Module: "${pluginName ? pluginModuleName : moduleName}"`);
			}

			// Run function
			return Promise.resolve(func)
				.then(async result => {
					// If function's result is a function or promise run/resolve it
					result = await Promise.resolve(result).then(result => typeof result === 'function' ? result() : result);

					// Get wanted result type
					result = result[pluginType || resultType];

					// Allow fields to be extracted
					if (directiveArgs.extractFromResponse) {
						result = get(result, directiveArgs.extractFromResponse);
					}

					log.debug(`${pluginName ? 'Plugin: ' + pluginName + ' ' : ''}Module: %s Result: %s`, pluginModuleName || moduleName, JSON.stringify(result, null, 2))
					return result;
				})
				.catch(error => {
					log.debug('%s: %s Error: %s', pluginName ? 'Plugin' : 'Module', pluginName || moduleName, error.message);
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

			if (!token) {
				throw new AppError('Missing apikey.');
			}

			if (!ApiManager.isValid(token)) {
				throw new AppError('Invalid apikey.');
			}
		}
	};
}