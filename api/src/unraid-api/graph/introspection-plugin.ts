import type { ApolloServerPlugin, GraphQLRequestListener } from '@apollo/server';

export const createDynamicIntrospectionPlugin = (
    isSandboxEnabled: () => boolean
): ApolloServerPlugin => ({
    requestDidStart: async () =>
        ({
            willSendResponse: async (requestContext) => {
                const { request, response } = requestContext;

                if (request.operationName === 'IntrospectionQuery' && !isSandboxEnabled()) {
                    response.body = {
                        kind: 'single',
                        singleResult: {
                            errors: [
                                {
                                    message:
                                        'GraphQL introspection is not allowed, but the current request is for introspection.',
                                    extensions: {
                                        code: 'GRAPHQL_VALIDATION_FAILED',
                                    },
                                },
                            ],
                        },
                    };
                    response.http.status = 400;
                }
            },
        }) satisfies GraphQLRequestListener<any>,
});
