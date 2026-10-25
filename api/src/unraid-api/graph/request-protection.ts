import { createRequire } from 'node:module';

import type { DocumentNode, GraphQLSchema } from 'graphql';
import type { SubscribePayload } from 'graphql-ws';
import { ApolloArmor } from '@escape.tech/graphql-armor';

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

export const graphqlWsOptions = {
    path: '/graphql',
    onSubscribe: (_context: unknown, _id: string, payload: SubscribePayload) => {
        try {
            graphqlForWs.parse(payload.query, { maxTokens: maxGraphqlTokens });
        } catch (error) {
            if (error instanceof graphqlForWs.GraphQLError) return [error];
            throw error;
        }
        return undefined;
    },
    // Nest passes this option to graphql-ws, although its subscription config omits the type.
    validate: (schema: GraphQLSchema, document: DocumentNode) =>
        graphqlForWs.validate(schema, document, websocketValidationRules),
};
