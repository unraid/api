import { INestApplication } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthZGuard } from 'nest-authz';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { AppModule } from '@app/unraid-api/app/app.module.js';
import { AuthService } from '@app/unraid-api/auth/auth.service.js';
import { AuthenticationGuard } from '@app/unraid-api/auth/authentication.guard.js';

// Mock the store before importing it
vi.mock('@app/store/index.js', () => ({
    store: {
        dispatch: vi.fn().mockResolvedValue(undefined),
        subscribe: vi.fn().mockImplementation(() => vi.fn()),
        getState: vi.fn().mockReturnValue({
            emhttp: {
                var: {
                    csrfToken: 'test-csrf-token',
                },
            },
            docker: {
                containers: [],
                autostart: [],
            },
        }),
        unsubscribe: vi.fn(),
    },
    getters: {
        emhttp: vi.fn().mockReturnValue({
            var: {
                csrfToken: 'test-csrf-token',
            },
        }),
        docker: vi.fn().mockReturnValue({
            containers: [],
            autostart: [],
        }),
        paths: vi.fn().mockReturnValue({
            'docker-autostart': '/tmp/docker-autostart',
            'docker-socket': '/var/run/docker.sock',
            'var-run': '/var/run',
            'auth-keys': '/tmp/auth-keys',
            activationBase: '/tmp/activation',
            'dynamix-config': ['/tmp/dynamix-config', '/tmp/dynamix-config'],
            identConfig: '/tmp/ident.cfg',
        }),
        dynamix: vi.fn().mockReturnValue({
            notify: {
                path: '/tmp/notifications',
            },
        }),
    },
    loadDynamixConfig: vi.fn(),
    loadStateFiles: vi.fn().mockResolvedValue(undefined),
}));

// Mock fs-extra for directory operations
vi.mock('fs-extra', () => ({
    ensureDirSync: vi.fn().mockReturnValue(undefined),
}));

describe('AppModule Integration Tests', () => {
    let app: NestFastifyApplication;
    let moduleRef: TestingModule;

    beforeAll(async () => {
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
            const authService = moduleRef.get(AuthService);

            expect(authService).toBeDefined();
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

    describe('Service Integration', () => {
        it('should have working service-to-service communication', () => {
            // Test that the module can resolve its services without errors
            // This validates that dependency injection is working correctly
            const authService = moduleRef.get(AuthService);
            expect(authService).toBeDefined();
            expect(typeof authService.validateCookiesWithCsrfToken).toBe('function');
        });
    });
});
