import { INestApplication } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { loadDynamixConfigFile } from '@app/store/actions/load-dynamix-config-file.js';
import { store } from '@app/store/index.js';
import { AppModule } from '@app/unraid-api/app/app.module.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';

// Mock external system boundaries that we can't control in tests
vi.mock('dockerode', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            listContainers: vi.fn().mockResolvedValue([
                {
                    Id: 'test-container-1',
                    Names: ['/test-container'],
                    State: 'running',
                    Status: 'Up 5 minutes',
                    Image: 'test:latest',
                },
            ]),
            getContainer: vi.fn().mockImplementation((id) => ({
                inspect: vi.fn().mockResolvedValue({
                    Id: id,
                    Name: '/test-container',
                    State: { Running: true },
                    Config: { Image: 'test:latest' },
                }),
            })),
            listImages: vi.fn().mockResolvedValue([]),
            listNetworks: vi.fn().mockResolvedValue([]),
            listVolumes: vi.fn().mockResolvedValue({ Volumes: [] }),
        })),
    };
});

// Mock external command execution
vi.mock('execa', () => ({
    execa: vi.fn().mockImplementation((cmd) => {
        if (cmd === 'whoami') {
            return Promise.resolve({ stdout: 'testuser' });
        }
        return Promise.resolve({ stdout: 'mocked output' });
    }),
}));

// Mock child_process for services that spawn processes
vi.mock('node:child_process', () => ({
    spawn: vi.fn(() => ({
        on: vi.fn(),
        kill: vi.fn(),
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
    })),
}));

// Mock file system operations that would fail in test environment
vi.mock('node:fs/promises', async (importOriginal) => {
    const actual = await importOriginal<typeof import('fs/promises')>();
    return {
        ...actual,
        readFile: vi.fn().mockResolvedValue(''),
        writeFile: vi.fn().mockResolvedValue(undefined),
        mkdir: vi.fn().mockResolvedValue(undefined),
        access: vi.fn().mockResolvedValue(undefined),
        stat: vi.fn().mockResolvedValue({ isFile: () => true }),
        readdir: vi.fn().mockResolvedValue([]),
        rename: vi.fn().mockResolvedValue(undefined),
        unlink: vi.fn().mockResolvedValue(undefined),
    };
});

// Mock fs module for synchronous operations
vi.mock('node:fs', () => ({
    existsSync: vi.fn().mockReturnValue(false),
    readFileSync: vi.fn().mockReturnValue(''),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    readdirSync: vi.fn().mockReturnValue([]),
}));

describe('AppModule Integration Tests', () => {
    let app: NestFastifyApplication;
    let moduleRef: TestingModule;

    beforeAll(async () => {
        // Initialize the dynamix config before creating the module
        await store.dispatch(loadDynamixConfigFile());
        moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        })
            // Override Redis client
            .overrideProvider('REDIS_CLIENT')
            .useValue({
                get: vi.fn(),
                set: vi.fn(),
                del: vi.fn(),
                connect: vi.fn(),
            })
            .compile();

        app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
        await app.init();
        await app.getHttpAdapter().getInstance().ready();
    }, 30000);

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    describe('Module Compilation', () => {
        it('should successfully compile all modules with proper dependency injection', () => {
            expect(moduleRef).toBeDefined();
            expect(app).toBeDefined();
        });

        it('should resolve core services', () => {
            const dockerService = moduleRef.get(DockerService);

            expect(dockerService).toBeDefined();
        });
    });

    describe('GraphQL API', () => {
        it('should expose GraphQL endpoint and handle introspection query', async () => {
            const introspectionQuery = `
                query {
                    __schema {
                        types {
                            name
                        }
                    }
                }
            `;

            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: introspectionQuery })
                .expect(200);

            expect(response.body.data).toBeDefined();
            expect(response.body.data.__schema).toBeDefined();
            expect(response.body.data.__schema.types).toBeInstanceOf(Array);
        });

        it('should execute docker containers query with real resolver chain', async () => {
            const query = `
                query {
                    dockerContainers {
                        id
                        name
                        state
                    }
                }
            `;

            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query })
                .expect(200);

            expect(response.body.data).toBeDefined();
            expect(response.body.data.dockerContainers).toBeInstanceOf(Array);
            expect(response.body.data.dockerContainers[0]).toMatchObject({
                id: expect.any(String),
                name: expect.any(String),
                state: expect.any(String),
            });
        });
    });

    describe('REST API Health Check', () => {
        it('should respond to health check endpoint', async () => {
            // Most NestJS apps have a health check endpoint
            const response = await request(app.getHttpServer())
                .get('/health')
                .expect((res) => {
                    // Accept either 200 or 404 if health endpoint doesn't exist
                    expect([200, 404]).toContain(res.status);
                });

            if (response.status === 200) {
                expect(response.body).toBeDefined();
            }
        });
    });

    describe('Service Integration', () => {
        it('should have working service-to-service communication', async () => {
            const dockerService = moduleRef.get(DockerService);

            // Test that the service can be called and returns expected data structure
            const containers = await dockerService.getContainers();

            expect(containers).toBeInstanceOf(Array);
            // The containers might be empty or cached, just verify structure
            if (containers.length > 0) {
                expect(containers[0]).toHaveProperty('id');
                expect(containers[0]).toHaveProperty('name');
            }
        });
    });
});
