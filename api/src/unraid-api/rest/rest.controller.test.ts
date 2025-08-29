import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { FastifyReply, FastifyRequest } from '@app/unraid-api/types/fastify.js';
import { OidcAuthService } from '@app/unraid-api/graph/resolvers/sso/oidc-auth.service.js';
import { OidcRequestHandler } from '@app/unraid-api/graph/resolvers/sso/oidc-request-handler.util.js';
import { RestController } from '@app/unraid-api/rest/rest.controller.js';
import { RestService } from '@app/unraid-api/rest/rest.service.js';

describe('RestController', () => {
    let controller: RestController;
    let restService: RestService;
    let oidcAuthService: OidcAuthService;
    let mockReply: Partial<FastifyReply>;

    // Helper function to create a mock request with the desired hostname
    const createMockRequest = (hostname?: string, headers: Record<string, any> = {}): FastifyRequest => {
        return {
            headers,
            hostname,
            url: '/test',
            protocol: 'https',
        } as FastifyRequest;
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [RestController],
            providers: [
                {
                    provide: RestService,
                    useValue: {
                        getLogs: vi.fn(),
                        getCustomizationStream: vi.fn(),
                    },
                },
                {
                    provide: OidcAuthService,
                    useValue: {
                        getAuthorizationUrl: vi.fn(),
                        handleCallback: vi.fn(),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: vi.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<RestController>(RestController);
        restService = module.get<RestService>(RestService);
        oidcAuthService = module.get<OidcAuthService>(OidcAuthService);

        mockReply = {
            status: vi.fn().mockReturnThis(),
            header: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis(),
            type: vi.fn().mockReturnThis(),
        };
    });

    describe('oidcAuthorize', () => {
        describe('redirect URI validation', () => {
            beforeEach(() => {
                // Mock OidcRequestHandler.handleAuthorize to return a valid auth URL
                vi.spyOn(OidcRequestHandler, 'handleAuthorize').mockResolvedValue(
                    'https://provider.com/authorize?client_id=test&redirect_uri=...'
                );
            });

            it('should accept redirect_uri with same hostname but different port', async () => {
                const mockRequest = createMockRequest('unraid.mytailnet.ts.net');

                await controller.oidcAuthorize(
                    'test-provider',
                    'test-state',
                    'https://unraid.mytailnet.ts.net:1443/graphql/api/auth/oidc/callback',
                    mockRequest,
                    mockReply as FastifyReply
                );

                expect(mockReply.status).toHaveBeenCalledWith(302);
                expect(OidcRequestHandler.handleAuthorize).toHaveBeenCalledWith(
                    'test-provider',
                    'test-state',
                    'https://unraid.mytailnet.ts.net:1443/graphql/api/auth/oidc/callback',
                    mockRequest,
                    oidcAuthService,
                    expect.any(Logger)
                );
            });

            it('should accept redirect_uri with same hostname and standard HTTPS port', async () => {
                const mockRequest = createMockRequest('unraid.mytailnet.ts.net');

                await controller.oidcAuthorize(
                    'test-provider',
                    'test-state',
                    'https://unraid.mytailnet.ts.net/graphql/api/auth/oidc/callback',
                    mockRequest,
                    mockReply as FastifyReply
                );

                expect(mockReply.status).toHaveBeenCalledWith(302);
                expect(OidcRequestHandler.handleAuthorize).toHaveBeenCalled();
            });

            it('should accept redirect_uri with same hostname and explicit port 443', async () => {
                const mockRequest = createMockRequest('unraid.mytailnet.ts.net');

                await controller.oidcAuthorize(
                    'test-provider',
                    'test-state',
                    'https://unraid.mytailnet.ts.net:443/graphql/api/auth/oidc/callback',
                    mockRequest,
                    mockReply as FastifyReply
                );

                expect(mockReply.status).toHaveBeenCalledWith(302);
                expect(OidcRequestHandler.handleAuthorize).toHaveBeenCalled();
            });

            it('should reject redirect_uri with different hostname', async () => {
                const mockRequest = createMockRequest('unraid.mytailnet.ts.net');

                await controller.oidcAuthorize(
                    'test-provider',
                    'test-state',
                    'https://evil.com/graphql/api/auth/oidc/callback',
                    mockRequest,
                    mockReply as FastifyReply
                );

                expect(mockReply.status).toHaveBeenCalledWith(400);
                expect(mockReply.send).toHaveBeenCalledWith(
                    'Invalid redirect_uri: https://evil.com/graphql/api/auth/oidc/callback. Hostname mismatch. Please add this callback URI to Settings → Management Access → Allowed Redirect URIs'
                );
                expect(OidcRequestHandler.handleAuthorize).not.toHaveBeenCalled();
            });

            it('should reject redirect_uri with subdomain difference', async () => {
                const mockRequest = createMockRequest('unraid.mytailnet.ts.net');

                await controller.oidcAuthorize(
                    'test-provider',
                    'test-state',
                    'https://evil.unraid.mytailnet.ts.net/graphql/api/auth/oidc/callback',
                    mockRequest,
                    mockReply as FastifyReply
                );

                expect(mockReply.status).toHaveBeenCalledWith(400);
                expect(mockReply.send).toHaveBeenCalledWith(
                    'Invalid redirect_uri: https://evil.unraid.mytailnet.ts.net/graphql/api/auth/oidc/callback. Hostname mismatch. Please add this callback URI to Settings → Management Access → Allowed Redirect URIs'
                );
                expect(OidcRequestHandler.handleAuthorize).not.toHaveBeenCalled();
            });

            it('should handle hostname from host header when hostname is not available', async () => {
                const mockRequest = createMockRequest(undefined, {
                    host: 'unraid.mytailnet.ts.net:8080',
                });

                await controller.oidcAuthorize(
                    'test-provider',
                    'test-state',
                    'https://unraid.mytailnet.ts.net:1443/graphql/api/auth/oidc/callback',
                    mockRequest,
                    mockReply as FastifyReply
                );

                expect(mockReply.status).toHaveBeenCalledWith(302);
                expect(OidcRequestHandler.handleAuthorize).toHaveBeenCalled();
            });

            it('should reject malformed redirect_uri', async () => {
                const mockRequest = createMockRequest('unraid.mytailnet.ts.net');

                await controller.oidcAuthorize(
                    'test-provider',
                    'test-state',
                    'not-a-valid-url',
                    mockRequest,
                    mockReply as FastifyReply
                );

                expect(mockReply.status).toHaveBeenCalledWith(400);
                expect(mockReply.send).toHaveBeenCalledWith(
                    'Invalid redirect_uri: not-a-valid-url. Invalid format. Please add this callback URI to Settings → Management Access → Allowed Redirect URIs'
                );
                expect(OidcRequestHandler.handleAuthorize).not.toHaveBeenCalled();
            });

            it('should handle case-insensitive hostname comparison', async () => {
                const mockRequest = createMockRequest('UnRaid.MyTailnet.TS.net');

                await controller.oidcAuthorize(
                    'test-provider',
                    'test-state',
                    'https://unraid.mytailnet.ts.net:1443/graphql/api/auth/oidc/callback',
                    mockRequest,
                    mockReply as FastifyReply
                );

                expect(mockReply.status).toHaveBeenCalledWith(302);
                expect(OidcRequestHandler.handleAuthorize).toHaveBeenCalled();
            });

            it('should preserve exact redirect_uri including custom port in call to handleAuthorize', async () => {
                const mockRequest = createMockRequest('unraid.mytailnet.ts.net');
                const customRedirectUri =
                    'https://unraid.mytailnet.ts.net:1443/graphql/api/auth/oidc/callback';

                await controller.oidcAuthorize(
                    'test-provider',
                    'test-state',
                    customRedirectUri,
                    mockRequest,
                    mockReply as FastifyReply
                );

                // Verify the exact redirect URI with port is passed through
                expect(OidcRequestHandler.handleAuthorize).toHaveBeenCalledWith(
                    'test-provider',
                    'test-state',
                    customRedirectUri, // Should be exactly as provided, with :1443
                    mockRequest,
                    oidcAuthService,
                    expect.any(Logger)
                );
            });

            it('should allow localhost with different ports', async () => {
                const mockRequest = createMockRequest('localhost');

                await controller.oidcAuthorize(
                    'test-provider',
                    'test-state',
                    'http://localhost:3000/graphql/api/auth/oidc/callback',
                    mockRequest,
                    mockReply as FastifyReply
                );

                expect(mockReply.status).toHaveBeenCalledWith(302);
                expect(OidcRequestHandler.handleAuthorize).toHaveBeenCalledWith(
                    'test-provider',
                    'test-state',
                    'http://localhost:3000/graphql/api/auth/oidc/callback',
                    mockRequest,
                    oidcAuthService,
                    expect.any(Logger)
                );
            });

            it('should allow IP addresses with different ports', async () => {
                const mockRequest = createMockRequest('192.168.1.100');

                await controller.oidcAuthorize(
                    'test-provider',
                    'test-state',
                    'http://192.168.1.100:8080/graphql/api/auth/oidc/callback',
                    mockRequest,
                    mockReply as FastifyReply
                );

                expect(mockReply.status).toHaveBeenCalledWith(302);
                expect(OidcRequestHandler.handleAuthorize).toHaveBeenCalled();
            });
        });

        describe('parameter validation', () => {
            it('should return 400 if redirect_uri is missing', async () => {
                const mockRequest = createMockRequest('unraid.local');

                await controller.oidcAuthorize(
                    'test-provider',
                    'test-state',
                    undefined as any,
                    mockRequest,
                    mockReply as FastifyReply
                );

                expect(mockReply.status).toHaveBeenCalledWith(400);
                // The controller catches validation errors and returns a generic message
                expect(mockReply.send).toHaveBeenCalledWith('Invalid provider or configuration');
            });

            it('should return 400 if providerId is missing', async () => {
                const mockRequest = createMockRequest('unraid.local');

                await controller.oidcAuthorize(
                    undefined as any,
                    'test-state',
                    'https://unraid.local/callback',
                    mockRequest,
                    mockReply as FastifyReply
                );

                expect(mockReply.status).toHaveBeenCalledWith(400);
            });

            it('should return 400 if state is missing', async () => {
                const mockRequest = createMockRequest('unraid.local');

                await controller.oidcAuthorize(
                    'test-provider',
                    undefined as any,
                    'https://unraid.local/callback',
                    mockRequest,
                    mockReply as FastifyReply
                );

                expect(mockReply.status).toHaveBeenCalledWith(400);
            });
        });
    });
});
