/*!
 * Copyright 2019-2020 Lime Technology Inc.  All rights reserved.
 * Written by: Alexis Tyler
 */

import get from 'lodash.get';
// @ts-ignore
// import * as core from '../../../core/src/index';
import uuid from 'uuid/v4';
import core from '@unraid/core';
import { makeExecutableSchema, SchemaDirectiveVisitor } from 'graphql-tools'
import { mergeTypes } from 'merge-graphql-schemas';
import gql from 'graphql-tag';
import { typeDefs, resolvers } from './schema';
import { wsHasConnected, wsHasDisconnected } from '../ws';

const { apiManager, errors, log, states, config, pluginManager } = core;
const { AppError, FatalAppError, PluginError } = errors;
const { usersState } = states;

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
		welcome: Welcome! @func(module: "getWelcome")
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
			testQuery(id: String!, input: testQueryInput): JSON @func(module: "getContext")
		}

		# Test mutation
		input testMutationInput {
			state: String!
		}
		type Mutation {
			testMutation(id: String!, input: testMutationInput): JSON @func(module: "getContext")
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
			context: Context @func(module: "getContext")
		}
	`;
	baseTypes.push(debugDefs);
}

const types = mergeTypes([
	...baseTypes,
	typeDefs
]);

const getCoreModule = (moduleName) => {
	if (!Object.keys(core.modules).includes(moduleName)) {
		throw new FatalAppError(`"${moduleName}" is not a valid core module.`);
	}

	return core.modules[moduleName];
};

const getPluginModule = (pluginName, pluginModuleName) => {
	if (!pluginManager.isInstalled(pluginName, pluginModuleName)) {
		throw new PluginError('Plugin not installed.');
	}

	if (!pluginManager.isActive(pluginName, pluginModuleName)) {
		throw new PluginError('Plugin disabled.');
	}

	return pluginManager.get(pluginName, pluginModuleName);
};

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
		field.resolve = async function (source, directiveArgs, { user }, info) {
			const {module: moduleName, result: resultType} = args;
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
			// If query    @func(param_1, param_2, input: query?)
			// If mutation @func(param_1, param_2, input: data)
			const context = {
				query,
				params,
				data,
				user
			};

			// Resolve func
			let func;
			try {
				if (pluginName) {
					const { filePath } = getPluginModule(pluginName, pluginModuleName);
					const pluginModule = require(filePath);
					// The file will either use a default export or a named one
					// If it's named it should be the same as a module name
					func = typeof pluginModule === 'function' ? pluginModule : pluginModule[pluginModuleName];
				} else {
					func = getCoreModule(moduleName);
				}
			} catch (error) {
				// Rethrow clean error message about module being missing
				if (error.code === 'MODULE_NOT_FOUND') {
					throw new AppError(`Cannot find ${pluginName ? 'Plugin: "' + pluginName + '" ' : ''}Module: "${pluginName ? pluginModuleName : moduleName}"`);
				}

				// In production let's just throw an internal error
				if (process.env.NODE_ENV === 'production') {
					throw new AppError('Internal error occurred');
				}

				// Otherwise re-throw actual error
				throw error;
			}

			const pluginOrModule = pluginName ? 'Plugin:' : 'Module:';
			const pluginOrModuleName = pluginModuleName || moduleName;

			// Run function
			let [error, result] = await Promise.resolve(func(context, core))
				.then(result => [undefined, result])
				.catch(error_ => {
					// Ensure we aren't leaking anything in production
					if (process.env.NODE_ENV === 'production') {
						log.error(pluginOrModule, pluginOrModuleName, 'Error:', error_.message);
						return [new Error(error_.message)];
					}

					const logger = log[error_.status && error_.status >= 400 ? 'error' : 'warn'];
					logger(pluginOrModule, pluginOrModuleName, 'Error:', error_);
					return [error_];
				});

			// Bail if we can't get the method to run
			if (error) {
				return error;
			}

			// Get wanted result type or fallback to json
			result = result[pluginType || resultType || 'json'];

			// Allow fields to be extracted
			if (directiveArgs.extractFromResponse) {
				result = get(result, directiveArgs.extractFromResponse);
			}

			log.debug(pluginOrModule, pluginOrModuleName, 'Result:', result);
			return result;
		};
	}
}

const schema = makeExecutableSchema({
	typeDefs: types,
	resolvers,
	schemaDirectives: {
		func: FuncDirective
	}
});

const ensureApiKey = (apiKeyToCheck: string) => {
	// Check there is atleast one valid key
	if (core.apiManager.getValidKeys().length !== 0) {
		if (!apiKeyToCheck) {
			throw new AppError('Missing API key.');
		}

		if (!apiManager.isValid(apiKeyToCheck)) {
			throw new AppError('Invalid API key.');
		}
	} else {
		if (process.env.NODE_ENV !== 'development') {
			throw new AppError('No valid API keys active.');
		}
	}
};

const debug = config.get('debug') === true;

export const graphql = {
	introspection: debug,
	playground: debug,
	schema,
	types,
	resolvers,
	subscriptions: {
		onConnect: connectionParams => {
			const apiKey = connectionParams['x-api-key'];

			ensureApiKey(apiKey);

			const user = usersState.findOne({apiKey}) || { name: 'guest', apiKey, role: 'guest' };
			const websocketId = uuid();

			log.info(`<ws> ${user.name}[${websocketId}] connected.`);

			// Update ws connection count and other needed values
			wsHasConnected(websocketId);

			return {
				user,
				websocketId
			};
		},
		onDisconnect: async (_, websocketContext) => {
			const { user, websocketId } = await websocketContext.initPromise;
			log.info(`<ws> ${user.name}[${websocketId}] disconnected.`);

			// Update ws connection count and other needed values
			wsHasDisconnected(websocketId);
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

		const user = usersState.findOne({apiKey}) || {name: 'guest', apiKey, role: 'guest'};

		return {
			user
		};
	}
};
