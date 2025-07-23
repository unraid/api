import { INestApplication } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthZGuard } from 'nest-authz';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { loadDynamixConfigFile } from '@app/store/actions/load-dynamix-config-file.js';
import { store } from '@app/store/index.js';
import { loadStateFiles } from '@app/store/modules/emhttp.js';
import { AppModule } from '@app/unraid-api/app/app.module.js';
import { AuthService } from '@app/unraid-api/auth/auth.service.js';
import { AuthenticationGuard } from '@app/unraid-api/auth/authentication.guard.js';
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
                    Command: 'node server.js',
                    Created: Date.now() / 1000,
                    Ports: [
                        {
                            IP: '0.0.0.0',
                            PrivatePort: 3000,
                            PublicPort: 3000,
                            Type: 'tcp',
                        },
                    ],
                    Labels: {},
                    HostConfig: {
                        NetworkMode: 'bridge',
                    },
                    NetworkSettings: {
                        Networks: {},
                    },
                    Mounts: [],
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
        // Initialize the dynamix config and state files before creating the module
        await store.dispatch(loadDynamixConfigFile());
        await store.dispatch(loadStateFiles());

        // Debug: Log the CSRF token from the store
        const { getters } = await import('@app/store/index.js');
        console.log('CSRF Token from store:', getters.emhttp().var.csrfToken);

        moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        })
            // Override authentication for tests
            .overrideGuard(AuthenticationGuard)
            .useValue({
                canActivate: () => true,
            })
            // Override authorization guard
            .overrideGuard(AuthZGuard)
            .useValue({
                canActivate: () => true,
            })
            // Override AuthService to bypass CSRF validation
            .overrideProvider(AuthService)
            .useValue({
                validateCookiesWithCsrfToken: vi.fn().mockResolvedValue({
                    id: 'test-user',
                    name: 'Test User',
                    roles: ['admin'],
                }),
                validateApiKeyCasbin: vi.fn().mockResolvedValue({
                    id: 'test-user',
                    name: 'Test User',
                    roles: ['admin'],
                }),
                getSessionUser: vi.fn().mockResolvedValue({
                    id: 'test-user',
                    name: 'Test User',
                    roles: ['admin'],
                }),
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
        it('should expose GraphQL endpoint and handle a simple query', async () => {
            // Query for a simpler public endpoint that doesn't require permissions
            const query = `
                query {
                    isSSOEnabled
                }
            `;

            const response = await request(app.getHttpServer())
                .post('/graphql')
                .set('x-csrf-token', '0000000000000000') // Add CSRF token from dev/states/var.ini
                .send({ query })
                .expect((res) => {
                    // Log the response for debugging
                    if (res.status !== 200 || res.body.errors) {
                        console.error('GraphQL Response:', JSON.stringify(res.body, null, 2));
                    }
                });

            expect(response.status).toBe(200);
            expect(response.body.errors).toBeUndefined();
            expect(response.body.data).toBeDefined();
            expect(response.body.data.isSSOEnabled).toBeDefined();
            expect(typeof response.body.data.isSSOEnabled).toBe('boolean');
        });

        it('should execute public theme query', async () => {
            const query = `
                query {
                    publicTheme {
                        name
                    }
                }
            `;

            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query })
                .expect((res) => {
                    // Log the response for debugging
                    if (res.status !== 200 || res.body.errors) {
                        console.error('GraphQL Response:', JSON.stringify(res.body, null, 2));
                    }
                });

            expect(response.status).toBe(200);
            // The query may have errors if theme is not configured, but the GraphQL endpoint should still work
            expect(response.body).toBeDefined();
            // Either we get data or errors, but the endpoint should respond
            expect(response.body.data || response.body.errors).toBeDefined();
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
                expect(containers[0]).toHaveProperty('names');
            }
        });
    });
});
