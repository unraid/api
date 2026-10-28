import { createServer } from 'node:http';
import { createRequire } from 'node:module';

import { buildSchema, parse, validate } from 'graphql';
import { createClient } from 'graphql-ws';
import { useServer } from 'graphql-ws/use/ws';
import { describe, expect, it } from 'vitest';
import WebSocket, { WebSocketServer } from 'ws';

import { createGraphqlWsOptions, requestProtection } from '@app/unraid-api/graph/request-protection.js';

const schema = buildSchema('type Query { value: String, child: Query }');

const validateRequest = (query: string) =>
    validate(schema, parse(query), requestProtection.validationRules);

describe('requestProtection', () => {
    it('allows normal queries and requests at the alias limit', () => {
        expect(validateRequest('{ value }')).toHaveLength(0);

        const aliases = Array.from({ length: 100 }, (_, index) => `a${index}: value`).join(' ');
        expect(validateRequest(`{ ${aliases} }`)).toHaveLength(0);
    });

    it('rejects requests that exceed the alias limit', () => {
        const aliases = Array.from({ length: 101 }, (_, index) => `a${index}: value`).join(' ');
        expect(validateRequest(`{ ${aliases} }`).length).toBeGreaterThan(0);
    });

    it('rejects excessive fields without aliases', () => {
        const fields = Array.from({ length: 1_001 }, () => 'value').join(' ');
        expect(validateRequest(`{ ${fields} }`).length).toBeGreaterThan(0);
    });

    it('counts repeated fragment spreads', () => {
        const spreads = Array.from({ length: 1_001 }, () => '...Values').join(' ');
        expect(
            validateRequest(`{ ${spreads} } fragment Values on Query { value }`).length
        ).toBeGreaterThan(0);
    });

    it('counts aliases and fields inside nested fragments', () => {
        const spreads = Array.from({ length: 101 }, () => '...Outer').join(' ');
        expect(
            validateRequest(
                `{ ${spreads} } fragment Outer on Query { ...Inner } fragment Inner on Query { alias: value }`
            ).length
        ).toBeGreaterThan(0);
    });

    it('rejects deeply nested fields', () => {
        const nested = `${'child { '.repeat(20)}value${' }'.repeat(20)}`;
        expect(validateRequest(`{ ${nested} }`).length).toBeGreaterThan(0);
    });

    it('does not count named fragments as field depth', () => {
        const fragments = Array.from(
            { length: 21 },
            (_, index) =>
                `fragment F${index} on Query { ${index === 20 ? 'value' : `...F${index + 1}`} }`
        ).join(' ');
        expect(validateRequest(`{ ...F0 } ${fragments}`)).toHaveLength(0);
    });

    it('checks each operation separately', () => {
        expect(validateRequest('query First { value } query Second { value }')).toHaveLength(0);
    });
});

describe('WebSocket introspection policy', () => {
    it('checks the selected operation before execution and reads sandbox changes on the same connection', async () => {
        const graphql: typeof import('graphql') = createRequire(import.meta.url)('graphql');
        const socketSchema = graphql.buildSchema('type Query { value: String }');
        let resolverCalls = 0;
        let sandboxEnabled = false;
        socketSchema.getQueryType()!.getFields().value.resolve = () => {
            resolverCalls++;
            return 'ok';
        };
        const server = createServer();
        const sockets = new WebSocketServer({ server, path: '/graphql' });
        const disposable = useServer(
            {
                schema: socketSchema,
                ...createGraphqlWsOptions(() => sandboxEnabled),
            },
            sockets
        );
        await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
        const address = server.address();
        if (!address || typeof address === 'string') throw new Error('Expected TCP listener');
        const client = createClient({
            url: `ws://127.0.0.1:${address.port}/graphql`,
            webSocketImpl: WebSocket,
            lazy: false,
            retryAttempts: 0,
        });
        const run = async (query: string, operationName?: string) => {
            const iterator = client.iterate({ query, operationName });
            try {
                return (await iterator.next()).value;
            } finally {
                await iterator.return?.();
            }
        };
        try {
            for (const query of [
                '{ __schema { queryType { name } } value }',
                '{ metadata: __type(name: "Query") { name } value }',
                'query { ...Metadata value } fragment Metadata on Query { __schema { queryType { name } } }',
                '{ ... on Query { __schema @include(if: true) { queryType { name } } } value }',
            ]) {
                await expect(run(query)).rejects.toEqual([
                    expect.objectContaining({ extensions: { code: 'INTROSPECTION_DISABLED' } }),
                ]);
            }
            expect(resolverCalls).toBe(0);
            const operations =
                'query Normal { value __typename } query Metadata { __schema { queryType { name } } }';
            expect((await run(operations, 'Normal'))?.data).toEqual({
                value: 'ok',
                __typename: 'Query',
            });
            await expect(run(operations, 'Metadata')).rejects.toBeDefined();
            sandboxEnabled = true;
            expect((await run(operations, 'Metadata'))?.data).toEqual({
                __schema: { queryType: { name: 'Query' } },
            });
            sandboxEnabled = false;
            await expect(run(operations, 'Metadata')).rejects.toBeDefined();
            const aliases = Array.from({ length: 101 }, (_, index) => `a${index}: value`).join(' ');
            await expect(run(`{ ${aliases} }`)).rejects.toBeDefined();
        } finally {
            await client.dispose();
            await disposable.dispose();
            await new Promise<void>((resolve, reject) =>
                server.close((error) => (error ? reject(error) : resolve()))
            );
        }
    });
});
