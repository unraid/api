import type { ApolloServerPlugin, GraphQLRequestListener } from '@apollo/server';

export const createDynamicIntrospectionPlugin = (
    isSandboxEnabled: () => boolean
): ApolloServerPlugin => ({
    requestDidStart: async () =>
        ({
            willSendResponse: async (requestContext) => {
                const { request, response } = requestContext;

                // Detect introspection queries:
                // 1. Standard operation name "IntrospectionQuery"
                // 2. Queries containing __schema at root level (main introspection entry point)
                // Note: __type and __typename are also used in regular queries, so we don't block them
                const isIntrospectionRequest =
                    request.operationName === 'IntrospectionQuery' ||
                    (request.query &&
                        // Check for __schema which is the main introspection entry point
                        // Match patterns like: { __schema { ... } } or query { __schema { ... } }
                        /\{\s*__schema\s*[{(]/.test(request.query));

                if (isIntrospectionRequest && !isSandboxEnabled()) {
                    response.body = {
                        kind: 'single',
                        singleResult: {
                            errors: [
                                {
                                    message:
                                        'GraphQL introspection is not allowed, but the current request is for introspection.',
                                    extensions: {
                                        code: 'INTROSPECTION_DISABLED',
                                    },
                                },
                            ],
                        },
                    };
                    if (response.http) {
                        response.http.status = 400;
                    }
                }
            },
        }) satisfies GraphQLRequestListener<any>,
});
