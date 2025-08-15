import type { ApolloServerPlugin, GraphQLRequestListener } from '@apollo/server';

export const createDynamicIntrospectionPlugin = (
    isSandboxEnabled: () => boolean
): ApolloServerPlugin => ({
    requestDidStart: async () =>
        ({
            willSendResponse: async (requestContext) => {
                const { request, response } = requestContext;

                // Detect introspection either by conventional operationName or by presence of __schema/__type in query
                const isIntrospectionRequest =
                    request.operationName === 'IntrospectionQuery' ||
                    (request.query &&
                        (request.query.includes('__schema') || request.query.includes('__type')));

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
