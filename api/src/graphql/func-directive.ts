import get from 'lodash/get';
import * as core from '@app/core';
import { graphqlLogger } from '@app/core/log';
import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { getCoreModule } from '@app/graphql/index';
import type { GraphQLFieldResolver, GraphQLSchema } from 'graphql';
import type { User } from '@app/core/types/states/user';

interface FuncDirective {
	module: string;
	data: object;
	query: any;
	extractFromResponse: string;
}

const funcDirectiveResolver: (directiveArgs: FuncDirective) => GraphQLFieldResolver<undefined, { user?: User }, { result?: any }> | undefined = ({
	module: coreModule,
	data,
	query,
	extractFromResponse,
}) => async (_, args, context, _info) => {
	const func = getCoreModule(coreModule);

	const functionContext = {
		query,
		data,
		user: context.user,
	};

	// Run function
	const [error, coreMethodResult] = await Promise.resolve(func(functionContext, core))
		.then(result => [undefined, result])
		.catch(error_ => {
			// Ensure we aren't leaking anything in production
			if (process.env.NODE_ENV === 'production') {
				graphqlLogger.error('Module:', coreModule, 'Error:', error_.message);
				return [new Error(error_.message)];
			}

			return [error_];
		});

	// Bail if we can't get the method to run
	if (error) {
		return error;
	}

	// Get wanted result type or fallback to json
	const result = coreMethodResult[args.result || 'json'];

	// Allow fields to be extracted
	if (extractFromResponse) {
		return get(result, extractFromResponse);
	}

	return result;
};

/**
 * Get the func directive - this is used to resolve @func directives in the graphql schema
 * @returns Type definition and schema interceptor to create resolvers for @func directives
 */
export function getFuncDirective() {
	const directiveName = 'func';
	return {
		funcDirectiveTypeDefs: /* GraphQL */`
			directive @func(
				module: String!
				data: JSON
				query: JSON
				result: String
				extractFromResponse: String
			) on FIELD_DEFINITION
		`,
		funcDirectiveTransformer: (schema: GraphQLSchema): GraphQLSchema => mapSchema(schema, {
			[MapperKind.MUTATION_ROOT_FIELD](fieldConfig) {
				const funcDirective = getDirective(schema, fieldConfig, directiveName)?.[0] as FuncDirective | undefined;
				if (funcDirective?.module) {
					fieldConfig.resolve = funcDirectiveResolver(funcDirective);
				}

				return fieldConfig;
			},
			[MapperKind.QUERY_ROOT_FIELD](fieldConfig) {
				const funcDirective = getDirective(schema, fieldConfig, directiveName)?.[0] as FuncDirective | undefined;
				if (funcDirective?.module) {
					fieldConfig.resolve = funcDirectiveResolver(funcDirective);
				}

				return fieldConfig;
			},
		}),
	};
}
