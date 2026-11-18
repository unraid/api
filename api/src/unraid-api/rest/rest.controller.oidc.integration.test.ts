import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { FastifyReply, FastifyRequest } from '@app/unraid-api/types/fastify.js';
import { FastifyThrottlerGuard } from '@app/unraid-api/auth/fastify-throttler.guard.js';
import { OidcAuthorizationService } from '@app/unraid-api/graph/resolvers/sso/auth/oidc-authorization.service.js';
import { OidcClaimsService } from '@app/unraid-api/graph/resolvers/sso/auth/oidc-claims.service.js';
import { OidcTokenExchangeService } from '@app/unraid-api/graph/resolvers/sso/auth/oidc-token-exchange.service.js';
import { OidcClientConfigService } from '@app/unraid-api/graph/resolvers/sso/client/oidc-client-config.service.js';
import { OidcRedirectUriService } from '@app/unraid-api/graph/resolvers/sso/client/oidc-redirect-uri.service.js';
import { OidcConfigPersistence } from '@app/unraid-api/graph/resolvers/sso/core/oidc-config.service.js';
import { OidcValidationService } from '@app/unraid-api/graph/resolvers/sso/core/oidc-validation.service.js';
import { OidcService } from '@app/unraid-api/graph/resolvers/sso/core/oidc.service.js';
import {
    AuthorizationOperator,
    OidcProvider,
} from '@app/unraid-api/graph/resolvers/sso/models/oidc-provider.model.js';
import { OidcSessionService } from '@app/unraid-api/graph/resolvers/sso/session/oidc-session.service.js';
import { OidcStateService } from '@app/unraid-api/graph/resolvers/sso/session/oidc-state.service.js';
import { OidcRequestHandler } from '@app/unraid-api/graph/resolvers/sso/utils/oidc-request-handler.util.js';
import { RestController } from '@app/unraid-api/rest/rest.controller.js';
import { RestService } from '@app/unraid-api/rest/rest.service.js';

describe('RestController OIDC authorize integration', () => {
    let controller: RestController;
    let app: NestFastifyApplication;
    let oidcConfig: {
        getConfig: ReturnType<typeof vi.fn>;
        getProvider: ReturnType<typeof vi.fn>;
    };
    let oidcStateService: {
        generateSecureState: ReturnType<typeof vi.fn>;
    };
    let headerSpy: ReturnType<typeof vi.fn>;
    let sendSpy: ReturnType<typeof vi.fn>;
    let statusSpy: ReturnType<typeof vi.fn>;
    let mockReply: FastifyReply;

    const provider: OidcProvider = {
        id: 'test-provider',
        name: 'Test Provider',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        authorizationEndpoint: 'https://provider.example.com/oauth/authorize',
        tokenEndpoint: 'https://provider.example.com/oauth/token',
        scopes: ['openid', 'profile'],
        authorizationRules: [
            {
                claim: 'email',
                operator: AuthorizationOperator.EQUALS,
                value: ['user@example.com'],
            },
        ],
    };

    const createMockRequest = (
        hostname?: string,
        headers: Record<string, string | string[] | undefined> = {},
        options: {
            host?: string;
            protocol?: string;
        } = {}
    ): FastifyRequest =>
        ({
            headers,
            hostname,
            host: options.host ?? hostname ?? headers.host,
            url: '/graphql/api/auth/oidc/authorize/test-provider',
            protocol: options.protocol ?? 'https',
        }) as FastifyRequest;

    beforeEach(async () => {
        vi.restoreAllMocks();

        oidcConfig = {
            getConfig: vi.fn().mockResolvedValue({
                providers: [provider],
                defaultAllowedOrigins: [],
            }),
            getProvider: vi.fn().mockResolvedValue(provider),
        };

        oidcStateService = {
            generateSecureState: vi.fn().mockResolvedValue('test-provider:signed-state'),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [RestController],
            providers: [
                OidcService,
                OidcRedirectUriService,
                {
                    provide: RestService,
                    useValue: {
                        getCustomizationStream: vi.fn(),
                    },
                },
                {
                    provide: OidcConfigPersistence,
                    useValue: oidcConfig,
                },
                {
                    provide: OidcSessionService,
                    useValue: {
                        createSession: vi.fn(),
                    },
                },
                {
                    provide: OidcStateService,
                    useValue: oidcStateService,
                },
                {
                    provide: OidcValidationService,
                    useValue: {
                        validateProvider: vi.fn(),
                        performDiscovery: vi.fn(),
                    },
                },
                {
                    provide: OidcAuthorizationService,
                    useValue: {
                        checkAuthorization: vi.fn(),
                    },
                },
                {
                    provide: OidcClientConfigService,
                    useValue: {
                        getOrCreateConfig: vi.fn(),
                        clearCache: vi.fn(),
                    },
                },
                {
                    provide: OidcTokenExchangeService,
                    useValue: {
                        exchangeCodeForTokens: vi.fn(),
                    },
                },
                {
                    provide: OidcClaimsService,
                    useValue: {
                        parseIdToken: vi.fn(),
                        validateClaims: vi.fn(),
                    },
                },
            ],
        })
            .overrideGuard(FastifyThrottlerGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<RestController>(RestController);
        app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
        app.useGlobalPipes(
            new ValidationPipe({
                transform: true,
                whitelist: true,
                forbidNonWhitelisted: true,
                transformOptions: { enableImplicitConversion: true },
            })
        );
        await app.init();
        await app.getHttpAdapter().getInstance().ready();

        statusSpy = vi.fn();
        headerSpy = vi.fn();
        sendSpy = vi.fn();

        const reply = {} as FastifyReply;

        reply.status = ((statusCode: number) => {
            statusSpy(statusCode);
            return reply;
        }) as FastifyReply['status'];
        reply.header = ((name: string, value: string) => {
            headerSpy(name, value);
            return reply;
        }) as FastifyReply['header'];
        reply.send = ((payload?: unknown) => {
            sendSpy(payload);
            return reply;
        }) as FastifyReply['send'];

        mockReply = reply;
    });

    afterEach(async () => {
        await app?.close();
    });

    it('preserves ordinary authorization parameters through the production HTTP validation pipeline', async () => {
        const query = new URLSearchParams({
            state: 'client-state-123',
            redirect_uri: 'http://localhost/graphql/api/auth/oidc/callback',
        });
        const response = await app.inject({
            method: 'GET',
            url: `/graphql/api/auth/oidc/authorize/${provider.id}?${query}`,
        });
        expect(response.statusCode).toBe(302);
        expect(oidcStateService.generateSecureState).toHaveBeenCalledWith(
            provider.id,
            'client-state-123',
            'http://localhost/graphql/api/auth/oidc/callback'
        );
    });

    it.each([
        ['repeated state', 'state=one&state=two&redirect_uri=http://localhost'],
        [
            'repeated redirect URI',
            'state=one&redirect_uri=http://localhost/graphql/api/auth/oidc/callback&redirect_uri=http://localhost/graphql/api/auth/oidc/callback',
        ],
        ['missing state', 'redirect_uri=http://localhost'],
        ['missing redirect URI', 'state=one'],
        ['overlong state', `state=${'x'.repeat(257)}&redirect_uri=http://localhost`],
        ['overlong redirect URI', `state=one&redirect_uri=http://localhost/${'x'.repeat(2048)}`],
    ])('rejects %s before allocating authorization state', async (_name, query) => {
        const response = await app.inject({
            method: 'GET',
            url: `/graphql/api/auth/oidc/authorize/${provider.id}?${query}`,
        });
        expect(response.statusCode).toBe(400);
        expect(oidcStateService.generateSecureState).not.toHaveBeenCalled();
    });

    it.each([
        ['repeated code', 'code=one&code=two&state=state'],
        ['repeated state', 'code=code&state=one&state=two'],
        ['missing code', 'state=state'],
        ['missing state', 'code=code'],
    ])('rejects callback %s before routing the callback', async (_name, query) => {
        const callback = vi.spyOn(OidcRequestHandler, 'handleCallback');
        const response = await app.inject({
            method: 'GET',
            url: `/graphql/api/auth/oidc/callback?${query}`,
        });
        expect(response.statusCode).toBe(302);
        expect(response.headers.location).toBe('/login#error=Authentication%20failed');
        expect(callback).not.toHaveBeenCalled();
    });

    it('authorizes successfully through both redirect validation layers for proxied domains', async () => {
        const mockRequest = createMockRequest(
            undefined,
            {
                'x-forwarded-proto': 'https, http',
                'x-forwarded-host': 'nas.domain.com, 10.0.0.15',
                host: '127.0.0.1:3001',
            },
            {
                host: 'nas.domain.com',
                protocol: 'https',
            }
        );

        await controller.oidcAuthorize(
            provider.id,
            'client-state-123',
            'https://nas.domain.com/graphql/api/auth/oidc/callback',
            mockRequest,
            mockReply
        );

        expect(oidcStateService.generateSecureState).toHaveBeenCalledWith(
            provider.id,
            'client-state-123',
            'https://nas.domain.com/graphql/api/auth/oidc/callback'
        );

        expect(statusSpy).toHaveBeenCalledWith(302);
        expect(headerSpy).toHaveBeenCalledWith(
            'Location',
            expect.stringContaining('https://provider.example.com/oauth/authorize')
        );

        const locationHeaderCall = vi.mocked(headerSpy).mock.calls.find(([name]) => name === 'Location');

        expect(locationHeaderCall).toBeDefined();

        const locationHeader = locationHeaderCall?.[1];
        expect(locationHeader).toBeTypeOf('string');

        if (typeof locationHeader !== 'string') {
            throw new Error('Expected redirect Location header to be set');
        }

        const locationUrl = new URL(locationHeader);
        expect(locationUrl.searchParams.get('redirect_uri')).toBe(
            'https://nas.domain.com/graphql/api/auth/oidc/callback'
        );
        expect(locationUrl.searchParams.get('state')).toBe('test-provider:signed-state');
    });
});
