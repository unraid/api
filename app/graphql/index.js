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

module.exports = function ($injector, get, gql, graphql, graphqlDirective, mergeGraphqlSchemas, ApiManager, log, typeDefs, resolvers, AppError, PluginManager, PluginError) {
	const { buildSchema } = graphql;
	const { addDirectiveResolveFunctionsToSchema } = graphqlDirective;
	const { mergeTypes } = mergeGraphqlSchemas;
	const types = [gql`
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

		directive @container on FIELD_DEFINITION

		type Query {
			info: Info @container
			pluginModule(plugin: String!, module: String!, params: JSON, result: String): JSON @func(result: "json")
		}

		type Mutation {
			login(username: String!, password: String!): String

			shutdown: String
			reboot: String
		}
	`];

	// Add debug defs in dev mode
	if (process.env.NODE_ENV === 'development') {
		const debugDefs = gql`
			# Test query
			input testQueryInput {
				state: String!
				optional: Boolean
			}
			type Query {
				testQuery(id: String!, red: String, input: testQueryInput): JSON @func(module: "debug/return-context")
			}

			# Test mutation
			input testMutationInput {
				state: String!
			}
			type Mutation {
				testMutation(id: String!, input: testMutationInput, red: String!): JSON @func(module: "debug/return-context")
			}
		`;
		types.push(debugDefs);
	}

	const schema = buildSchema(mergeTypes([...types, typeDefs]));

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
			const mapQueryVars = args => args.map(param => {
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
			const { plugin: pluginName, module: pluginModuleName, result: pluginType, input, ...params } = mapQueryVars(args);
			const operationType = info.operation.operation;
			let query = {
				...directiveArgs.query,
				...(operationType === 'query' ? input : {})
			};
			let data = {
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
					data
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