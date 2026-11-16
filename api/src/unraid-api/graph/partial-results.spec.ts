import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule, GraphQLSchemaHost, Query, Resolver } from '@nestjs/graphql';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { readFile } from 'fs/promises';

import { PrefixedID } from '@unraid/shared/prefixed-id-scalar.js';
import { buildSchema } from 'graphql';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { DockerResolver } from '@app/unraid-api/graph/resolvers/docker/docker.resolver.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';
import { VmsResolver } from '@app/unraid-api/graph/resolvers/vms/vms.resolver.js';
import { VmsService } from '@app/unraid-api/graph/resolvers/vms/vms.service.js';
import { SubscriptionTrackerService } from '@app/unraid-api/graph/services/subscription-tracker.service.js';

@Resolver()
class ServerStatusResolver {
    @Query(() => String)
    serverStatus() {
        return 'available';
    }
}

type Result = {
    data: Record<string, unknown> | null;
    errors?: { path: (string | number)[] }[];
};

describe('Partial GraphQL results for unavailable services', () => {
    let app: NestFastifyApplication;
    const vms = { getDomains: vi.fn() };
    const docker = { getNetworks: vi.fn() };

    beforeAll(async () => {
        const module = await Test.createTestingModule({
            imports: [
                GraphQLModule.forRoot<ApolloDriverConfig>({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                }),
            ],
            providers: [
                PrefixedID,
                ServerStatusResolver,
                VmsResolver,
                DockerResolver,
                { provide: VmsService, useValue: vms },
                { provide: DockerService, useValue: docker },
                {
                    provide: SubscriptionTrackerService,
                    useValue: { registerTopic: vi.fn() },
                },
            ],
        })
            .useMocker(() => ({}))
            .compile();
        app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
        await app.init();
        await app.getHttpAdapter().getInstance().ready();
    });

    beforeEach(() => {
        vms.getDomains.mockReset().mockResolvedValue([]);
        docker.getNetworks.mockReset().mockResolvedValue([]);
    });

    afterAll(async () => app?.close());

    async function execute(query: string): Promise<Result> {
        const response = await app.inject({ method: 'POST', url: '/graphql', payload: { query } });
        expect(response.statusCode).toBe(200);
        return response.json<Result>();
    }

    it('keeps the runtime and published service roots nullable', async () => {
        const published = buildSchema(await readFile('generated-schema.graphql', 'utf8'));
        const runtime = app.get(GraphQLSchemaHost).schema;
        for (const schema of [published, runtime]) {
            for (const root of ['vms', 'docker']) {
                expect(schema.getQueryType()!.getFields()[root].type.toString()).toBe(
                    root === 'vms' ? 'Vms' : 'Docker'
                );
            }
        }
    });

    it.each(['domain', 'domains'])('preserves other roots when vms.%s fails', async (field) => {
        vms.getDomains.mockRejectedValue(new Error('VMs are not available'));
        const result = await execute(
            `{ serverStatus vms { ${field} { id } } docker { networks { id } } }`
        );
        expect(result.data).toEqual({
            serverStatus: 'available',
            vms: { [field]: null },
            docker: { networks: [] },
        });
        expect(result.errors?.map((error) => error.path)).toEqual([['vms', field]]);
    });

    it('preserves other roots when Docker fails', async () => {
        docker.getNetworks.mockRejectedValue(new Error('Docker is not available'));
        const result = await execute(
            '{ serverStatus vms { domains { id } } docker { networks { id } } }'
        );
        expect(result.data).toEqual({ serverStatus: 'available', vms: { domains: [] }, docker: null });
        expect(result.errors?.map((error) => error.path)).toEqual([['docker', 'networks']]);
    });

    it('retains successful data and both errors when both services fail', async () => {
        vms.getDomains.mockRejectedValue(new Error('VMs are not available'));
        docker.getNetworks.mockRejectedValue(new Error('Docker is not available'));
        const result = await execute(
            '{ serverStatus guests: vms { domains { id } } containers: docker { networks { id } } }'
        );
        expect(result.data).toEqual({
            serverStatus: 'available',
            guests: { domains: null },
            containers: null,
        });
        expect(result.errors?.map((error) => error.path)).toEqual(
            expect.arrayContaining([
                ['guests', 'domains'],
                ['containers', 'networks'],
            ])
        );
        expect(result.errors).toHaveLength(2);
    });

    it('preserves successful empty service results', async () => {
        const result = await execute(
            '{ serverStatus vms { domains { id } } docker { networks { id } } }'
        );
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            serverStatus: 'available',
            vms: { domains: [] },
            docker: { networks: [] },
        });
    });
});
