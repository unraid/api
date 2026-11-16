import { INestApplication } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import WebSocket from 'ws';

import { AppModule } from '@app/unraid-api/app/app.module.js';
import { AuthService } from '@app/unraid-api/auth/auth.service.js';
import { AuthenticationGuard } from '@app/unraid-api/auth/authentication.guard.js';
import { AuthorizationGuard } from '@app/unraid-api/auth/authorization.guard.js';

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
            .overrideGuard(AuthorizationGuard)
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

        it('rejects an amplified GraphQL request before execution', async () => {
            const fields = Array.from({ length: 101 }, (_, index) => `a${index}: isSSOEnabled`).join(
                ' '
            );
            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: `{ ${fields} }` });

            expect(response.status).toBe(400);
            expect(response.body.data).toBeUndefined();
            expect(response.body.errors).toBeDefined();
        });

        it('rejects oversized GraphQL documents during parsing', async () => {
            const fields = Array.from({ length: 2_501 }, (_, index) => `a${index}: isSSOEnabled`).join(
                ' '
            );
            const response = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: `{ ${fields} }` });

            expect(response.status).toBe(400);
            expect(response.body.data).toBeUndefined();
            expect(response.body.errors).toBeDefined();
        });

        it('applies the same bounds to WebSocket operations', async () => {
            await app.listen(0, '127.0.0.1');
            const address = app.getHttpServer().address();
            if (!address || typeof address === 'string') throw new Error('Expected TCP listener');
            const socket = new WebSocket(
                `ws://127.0.0.1:${address.port}/graphql`,
                'graphql-transport-ws'
            );
            type Message = { type: string; payload?: unknown };
            const messages: Message[] = [];
            let waiting: ((message: Message) => void) | undefined;
            socket.on('message', (data) => {
                const message: Message = JSON.parse(data.toString());
                if (waiting) {
                    const resolve = waiting;
                    waiting = undefined;
                    resolve(message);
                } else {
                    messages.push(message);
                }
            });
            const receive = () => {
                const queued = messages.shift();
                if (queued) return Promise.resolve(queued);
                return new Promise<Message>((resolve, reject) => {
                    const timer = setTimeout(() => {
                        waiting = undefined;
                        reject(new Error('WebSocket response timed out'));
                    }, 5_000);
                    waiting = (message) => {
                        clearTimeout(timer);
                        resolve(message);
                    };
                });
            };

            try {
                await new Promise<void>((resolve, reject) => {
                    socket.once('open', () => resolve());
                    socket.once('error', reject);
                });
                const acknowledgement = receive();
                socket.send(JSON.stringify({ type: 'connection_init' }));
                expect((await acknowledgement).type).toBe('connection_ack');

                const normalResponse = receive();
                socket.send(
                    JSON.stringify({
                        id: 'normal',
                        type: 'subscribe',
                        payload: { query: '{ isSSOEnabled }' },
                    })
                );
                expect((await normalResponse).type).toBe('next');
                expect((await receive()).type).toBe('complete');

                const aliases = Array.from(
                    { length: 101 },
                    (_, index) => `a${index}: isSSOEnabled`
                ).join(' ');
                const aliasResponse = receive();
                socket.send(
                    JSON.stringify({
                        id: 'aliases',
                        type: 'subscribe',
                        payload: { query: `{ ${aliases} }` },
                    })
                );
                const aliasMessage = await aliasResponse;
                expect(aliasMessage.type).toBe('error');
                expect(JSON.stringify(aliasMessage.payload)).toContain('Aliases limit');

                const tokens = Array.from(
                    { length: 2_501 },
                    (_, index) => `a${index}: isSSOEnabled`
                ).join(' ');
                const tokenResponse = receive();
                socket.send(
                    JSON.stringify({
                        id: 'tokens',
                        type: 'subscribe',
                        payload: { query: `{ ${tokens} }` },
                    })
                );
                const tokenMessage = await tokenResponse;
                expect(tokenMessage.type).toBe('error');
                expect(JSON.stringify(tokenMessage.payload)).toContain('5000');
            } finally {
                socket.terminate();
            }
        }, 15_000);
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
