import { createRequire } from 'node:module';

import type { DocumentNode, GraphQLSchema } from 'graphql';
import type { SubscribePayload } from 'graphql-ws';
import { ApolloArmor } from '@escape.tech/graphql-armor';

import { isBlockedIntrospectionOperation } from '@app/unraid-api/graph/introspection-plugin.js';

export const maxGraphqlTokens = 5_000;

const graphqlForWs: typeof import('graphql') = createRequire(import.meta.url)('graphql');

export const requestProtection = new ApolloArmor({
    blockFieldSuggestion: { enabled: false },
    costLimit: {
        maxCost: 1_000,
        objectCost: 1,
        scalarCost: 1,
        depthCostFactor: 1,
        flattenFragments: true,
        ignoreIntrospection: false,
    },
    maxAliases: { n: 100, allowList: [] },
    maxDepth: { n: 20, flattenFragments: true, ignoreIntrospection: false },
    maxDirectives: { enabled: false },
    maxTokens: { enabled: false },
}).protect();

const websocketValidationRules = [...graphqlForWs.specifiedRules, ...requestProtection.validationRules];

export const createGraphqlWsOptions = (isSandboxEnabled: () => boolean) => ({
    path: '/graphql',
    onSubscribe: (_context: unknown, _id: string, payload: SubscribePayload) => {
        try {
            const document = graphqlForWs.parse(payload.query, { maxTokens: maxGraphqlTokens });
            const operation = graphqlForWs.getOperationAST(document, payload.operationName);
            if (
                !isSandboxEnabled() &&
                operation &&
                isBlockedIntrospectionOperation(operation, document)
            ) {
                return [
                    new graphqlForWs.GraphQLError(
                        'GraphQL introspection is not allowed, but the current request is for introspection.',
                        { extensions: { code: 'INTROSPECTION_DISABLED' } }
                    ),
                ];
            }
        } catch (error) {
            if (error instanceof graphqlForWs.GraphQLError) return [error];
            throw error;
        }
        return undefined;
    },
    // Nest passes this option to graphql-ws, although its subscription config omits the type.
    validate: (schema: GraphQLSchema, document: DocumentNode) =>
        graphqlForWs.validate(schema, document, websocketValidationRules),
});
