import get from 'lodash.get';
import * as core from '@app/core';
import { logger } from '@app/core';
import { SchemaDirectiveVisitor } from '@graphql-tools/utils';
import { getCoreModule } from '@app/graphql/index';

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

export class FuncDirective extends SchemaDirectiveVisitor {
	visitFieldDefinition(field: Record<string, any>) {
		const { args } = this;
		field.resolve = async function (_source, directiveArgs: {
			[key: string]: any;
			plugin: string;
			module: string;
			result: string;
			input: Record<string, any>;
			query: Record<string, any>;
		}, { user }, info: Record<string, any>) {
			const { module: moduleName, result: resultType } = args as {
				module: string;
				result: string;
			};
			const { plugin: _, module: __, result: pluginType, input, ...params } = directiveArgs;
			const operationType = info.operation.operation;
			const query = {
				...directiveArgs.query,
				...(operationType === 'query' ? input : {}),
			};
			const data = {
				...directiveArgs.data,
				...(operationType === 'mutation' ? input : {}),
			};
			// If query    @func(param_1, param_2, input: query?)
			// If mutation @func(param_1, param_2, input: data)
			const context = {
				query,
				params,
				data,
				user,
			};

			// Resolve func
			const func = getCoreModule(moduleName);

			// Run function
			const [error, coreMethodResult] = await Promise.resolve(func(context, core))
				.then(result => [undefined, result])
				.catch(error_ => {
					// Ensure we aren't leaking anything in production
					if (process.env.NODE_ENV === 'production') {
						logger.error('Module:', moduleName, 'Error:', error_.message);
						return [new Error(error_.message)];
					}

					return [error_];
				});

			// Bail if we can't get the method to run
			if (error) {
				return error;
			}

			// Get wanted result type or fallback to json
			const result = coreMethodResult[pluginType || resultType || 'json'];

			// Allow fields to be extracted
			if (directiveArgs.extractFromResponse) {
				return get(result, directiveArgs.extractFromResponse);
			}

			return result;
		};
	}
}
