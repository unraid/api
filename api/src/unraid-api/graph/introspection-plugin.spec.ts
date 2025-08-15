import { describe, expect, it, vi } from 'vitest';

import { createDynamicIntrospectionPlugin } from '@app/unraid-api/graph/introspection-plugin.js';

describe('Dynamic Introspection Plugin', () => {
    const mockResponse = () => ({
        body: null as any,
        http: {
            status: 200,
        },
    });

    const runPlugin = async (
        query: string | undefined,
        operationName: string | undefined,
        sandboxEnabled: boolean
    ) => {
        const isSandboxEnabled = vi.fn().mockReturnValue(sandboxEnabled);
        const plugin = createDynamicIntrospectionPlugin(isSandboxEnabled);

        const response = mockResponse();
        const requestContext = {
            request: {
                query,
                operationName,
            },
            response,
        } as any;

        const requestListener = await (plugin as any).requestDidStart();
        await requestListener.willSendResponse(requestContext);

        return response;
    };

    describe('when sandbox is enabled', () => {
        it('should allow introspection query with IntrospectionQuery operation name', async () => {
            const response = await runPlugin(
                'query IntrospectionQuery { __schema { queryType { name } } }',
                'IntrospectionQuery',
                true
            );

            expect(response.http.status).toBe(200);
            expect(response.body).toBeNull();
        });

        it('should allow direct __schema query', async () => {
            const response = await runPlugin('{ __schema { queryType { name } } }', undefined, true);

            expect(response.http.status).toBe(200);
            expect(response.body).toBeNull();
        });

        it('should allow regular queries with __type field', async () => {
            const response = await runPlugin(
                'query GetType { __type(name: "User") { name fields { name } } }',
                'GetType',
                true
            );

            expect(response.http.status).toBe(200);
            expect(response.body).toBeNull();
        });
    });

    describe('when sandbox is disabled', () => {
        it('should block introspection query with IntrospectionQuery operation name', async () => {
            const response = await runPlugin(
                'query IntrospectionQuery { __schema { queryType { name } } }',
                'IntrospectionQuery',
                false
            );

            expect(response.http.status).toBe(400);
            expect(response.body).toEqual({
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
            });
        });

        it('should block direct __schema query', async () => {
            const response = await runPlugin('{ __schema { queryType { name } } }', undefined, false);

            expect(response.http.status).toBe(400);
            expect(response.body?.singleResult?.errors?.[0]?.extensions?.code).toBe(
                'INTROSPECTION_DISABLED'
            );
        });

        it('should block __schema query with whitespace variations', async () => {
            const queries = [
                '{__schema{queryType{name}}}',
                '{ __schema { queryType { name } } }',
                '{\n  __schema\n  {\n    queryType\n    {\n      name\n    }\n  }\n}',
                'query { __schema { types { name } } }',
                'query MyQuery { __schema { directives { name } } }',
            ];

            for (const query of queries) {
                const response = await runPlugin(query, undefined, false);
                expect(response.http.status).toBe(400);
                expect(response.body?.singleResult?.errors?.[0]?.extensions?.code).toBe(
                    'INTROSPECTION_DISABLED'
                );
            }
        });

        it('should allow regular queries without introspection', async () => {
            const response = await runPlugin(
                'query GetUser { user(id: "123") { name email } }',
                'GetUser',
                false
            );

            expect(response.http.status).toBe(200);
            expect(response.body).toBeNull();
        });

        it('should allow queries with __type field (not full introspection)', async () => {
            const response = await runPlugin(
                'query GetType { __type(name: "User") { name fields { name } } }',
                'GetType',
                false
            );

            expect(response.http.status).toBe(200);
            expect(response.body).toBeNull();
        });

        it('should allow queries with __typename field', async () => {
            const response = await runPlugin(
                'query GetUser { user(id: "123") { __typename name email } }',
                'GetUser',
                false
            );

            expect(response.http.status).toBe(200);
            expect(response.body).toBeNull();
        });

        it('should allow mutations', async () => {
            const response = await runPlugin(
                'mutation CreateUser($input: UserInput!) { createUser(input: $input) { id name } }',
                'CreateUser',
                false
            );

            expect(response.http.status).toBe(200);
            expect(response.body).toBeNull();
        });

        it('should allow subscriptions', async () => {
            const response = await runPlugin(
                'subscription OnUserCreated { userCreated { id name } }',
                'OnUserCreated',
                false
            );

            expect(response.http.status).toBe(200);
            expect(response.body).toBeNull();
        });

        it('should not block when __schema appears in a string or comment', async () => {
            const response = await runPlugin(
                'query GetUser { user(id: "123") { name description } } # __schema is mentioned here',
                'GetUser',
                false
            );

            expect(response.http.status).toBe(200);
            expect(response.body).toBeNull();
        });

        it('should handle missing query gracefully', async () => {
            const response = await runPlugin(undefined, undefined, false);

            expect(response.http.status).toBe(200);
            expect(response.body).toBeNull();
        });

        it('should handle empty query gracefully', async () => {
            const response = await runPlugin('', undefined, false);

            expect(response.http.status).toBe(200);
            expect(response.body).toBeNull();
        });
    });

    describe('edge cases', () => {
        it('should handle response without http property', async () => {
            const isSandboxEnabled = vi.fn().mockReturnValue(false);
            const plugin = createDynamicIntrospectionPlugin(isSandboxEnabled);

            const response = { body: null as any };
            const requestContext = {
                request: {
                    query: '{ __schema { queryType { name } } }',
                    operationName: undefined,
                },
                response,
            } as any;

            const requestListener = await (plugin as any).requestDidStart();
            await requestListener.willSendResponse(requestContext);

            expect(response.body).toEqual({
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
            });
            // Should not throw even though response.http doesn't exist
        });

        it('should check sandbox status dynamically on each request', async () => {
            const isSandboxEnabled = vi.fn();
            const plugin = createDynamicIntrospectionPlugin(isSandboxEnabled);

            // First request - sandbox disabled
            isSandboxEnabled.mockReturnValue(false);
            const response1 = mockResponse();
            const requestContext1 = {
                request: {
                    query: '{ __schema { queryType { name } } }',
                    operationName: undefined,
                },
                response: response1,
            } as any;

            let requestListener = await (plugin as any).requestDidStart();
            await requestListener.willSendResponse(requestContext1);
            expect(response1.http.status).toBe(400);

            // Second request - sandbox enabled
            isSandboxEnabled.mockReturnValue(true);
            const response2 = mockResponse();
            const requestContext2 = {
                request: {
                    query: '{ __schema { queryType { name } } }',
                    operationName: undefined,
                },
                response: response2,
            } as any;

            requestListener = await (plugin as any).requestDidStart();
            await requestListener.willSendResponse(requestContext2);
            expect(response2.http.status).toBe(200);

            expect(isSandboxEnabled).toHaveBeenCalledTimes(2);
        });
    });
});
