import { Test, TestingModule } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { FastifyReply, FastifyRequest } from '@app/unraid-api/types/fastify.js';
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
import { RestController } from '@app/unraid-api/rest/rest.controller.js';
import { RestService } from '@app/unraid-api/rest/rest.service.js';

describe('RestController OIDC authorize integration', () => {
    let controller: RestController;
    let oidcConfig: {
        getConfig: ReturnType<typeof vi.fn>;
        getProvider: ReturnType<typeof vi.fn>;
    };
    let oidcStateService: {
        generateSecureState: ReturnType<typeof vi.fn>;
    };
    let mockReply: Partial<FastifyReply>;

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
        }).compile();

        controller = module.get<RestController>(RestController);

        mockReply = {
            status: vi.fn().mockReturnThis(),
            header: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis(),
        };
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
            mockReply as FastifyReply
        );

        expect(oidcStateService.generateSecureState).toHaveBeenCalledWith(
            provider.id,
            'client-state-123',
            'https://nas.domain.com/graphql/api/auth/oidc/callback'
        );

        expect(mockReply.status).toHaveBeenCalledWith(302);
        expect(mockReply.header).toHaveBeenCalledWith(
            'Location',
            expect.stringContaining('https://provider.example.com/oauth/authorize')
        );

        const headerMock = mockReply.header;
        expect(headerMock).toBeDefined();

        if (!headerMock) {
            throw new Error('Expected reply header mock to be set');
        }

        const locationHeaderCall = vi
            .mocked(headerMock)
            .mock.calls.find(([name]) => name === 'Location');

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
