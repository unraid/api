import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OidcAuthService } from '@app/unraid-api/graph/resolvers/sso/oidc-auth.service.js';
import { OidcConfigPersistence } from '@app/unraid-api/graph/resolvers/sso/oidc-config.service.js';
import {
    AuthorizationOperator,
    OidcAuthorizationRule,
    OidcProvider,
} from '@app/unraid-api/graph/resolvers/sso/oidc-provider.model.js';
import { OidcSessionService } from '@app/unraid-api/graph/resolvers/sso/oidc-session.service.js';
import { OidcValidationService } from '@app/unraid-api/graph/resolvers/sso/oidc-validation.service.js';

describe('OidcAuthService', () => {
    let service: OidcAuthService;
    let oidcConfig: any;
    let sessionService: any;
    let configService: any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OidcAuthService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: vi.fn(),
                    },
                },
                {
                    provide: OidcConfigPersistence,
                    useValue: {
                        getProvider: vi.fn(),
                    },
                },
                {
                    provide: OidcSessionService,
                    useValue: {
                        createSession: vi.fn(),
                    },
                },
                {
                    provide: OidcValidationService,
                    useValue: {
                        validateProvider: vi.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<OidcAuthService>(OidcAuthService);
        oidcConfig = module.get(OidcConfigPersistence);
        sessionService = module.get(OidcSessionService);
        configService = module.get(ConfigService);
    });

    describe('Authorization Rule Evaluation', () => {
        // Access the private method through any type casting for testing
        const evaluateRule = (rule: OidcAuthorizationRule, claims: any): boolean => {
            return (service as any).evaluateRule(rule, claims);
        };

        describe('EQUALS operator', () => {
            it('should return true when claim equals any value in the array', () => {
                const rule: OidcAuthorizationRule = {
                    claim: 'email',
                    operator: AuthorizationOperator.EQUALS,
                    value: ['user@example.com', 'admin@example.com'],
                };

                expect(evaluateRule(rule, { email: 'user@example.com' })).toBe(true);
                expect(evaluateRule(rule, { email: 'admin@example.com' })).toBe(true);
            });

            it('should return false when claim does not equal any value', () => {
                const rule: OidcAuthorizationRule = {
                    claim: 'email',
                    operator: AuthorizationOperator.EQUALS,
                    value: ['user@example.com'],
                };

                expect(evaluateRule(rule, { email: 'other@example.com' })).toBe(false);
            });

            it('should handle numeric values correctly', () => {
                const rule: OidcAuthorizationRule = {
                    claim: 'user_id',
                    operator: AuthorizationOperator.EQUALS,
                    value: ['12345'],
                };

                expect(evaluateRule(rule, { user_id: 12345 })).toBe(true);
                expect(evaluateRule(rule, { user_id: '12345' })).toBe(true);
            });
        });

        describe('CONTAINS operator', () => {
            it('should return true when claim contains any substring', () => {
                const rule: OidcAuthorizationRule = {
                    claim: 'email',
                    operator: AuthorizationOperator.CONTAINS,
                    value: ['@company.com', '@partner.org'],
                };

                expect(evaluateRule(rule, { email: 'john@company.com' })).toBe(true);
                expect(evaluateRule(rule, { email: 'jane@partner.org' })).toBe(true);
            });

            it('should return false when claim does not contain any substring', () => {
                const rule: OidcAuthorizationRule = {
                    claim: 'email',
                    operator: AuthorizationOperator.CONTAINS,
                    value: ['@company.com'],
                };

                expect(evaluateRule(rule, { email: 'user@other.org' })).toBe(false);
            });

            it('should be case sensitive', () => {
                const rule: OidcAuthorizationRule = {
                    claim: 'name',
                    operator: AuthorizationOperator.CONTAINS,
                    value: ['Admin'],
                };

                expect(evaluateRule(rule, { name: 'Administrator' })).toBe(true);
                expect(evaluateRule(rule, { name: 'administrator' })).toBe(false);
            });
        });

        describe('STARTS_WITH operator', () => {
            it('should return true when claim starts with any prefix', () => {
                const rule: OidcAuthorizationRule = {
                    claim: 'department',
                    operator: AuthorizationOperator.STARTS_WITH,
                    value: ['eng-', 'dev-'],
                };

                expect(evaluateRule(rule, { department: 'eng-backend' })).toBe(true);
                expect(evaluateRule(rule, { department: 'dev-frontend' })).toBe(true);
            });

            it('should return false when claim does not start with any prefix', () => {
                const rule: OidcAuthorizationRule = {
                    claim: 'department',
                    operator: AuthorizationOperator.STARTS_WITH,
                    value: ['eng-'],
                };

                expect(evaluateRule(rule, { department: 'marketing-team' })).toBe(false);
                expect(evaluateRule(rule, { department: 'backend-eng' })).toBe(false);
            });
        });

        describe('ENDS_WITH operator', () => {
            it('should return true when claim ends with any suffix', () => {
                const rule: OidcAuthorizationRule = {
                    claim: 'email',
                    operator: AuthorizationOperator.ENDS_WITH,
                    value: ['@gmail.com', '@company.com'],
                };

                expect(evaluateRule(rule, { email: 'user@gmail.com' })).toBe(true);
                expect(evaluateRule(rule, { email: 'admin@company.com' })).toBe(true);
            });

            it('should return false when claim does not end with any suffix', () => {
                const rule: OidcAuthorizationRule = {
                    claim: 'email',
                    operator: AuthorizationOperator.ENDS_WITH,
                    value: ['@company.com'],
                };

                expect(evaluateRule(rule, { email: 'user@other.org' })).toBe(false);
            });

            it('should handle domain validation correctly', () => {
                const rule: OidcAuthorizationRule = {
                    claim: 'hd',
                    operator: AuthorizationOperator.ENDS_WITH,
                    value: ['.edu'],
                };

                expect(evaluateRule(rule, { hd: 'university.edu' })).toBe(true);
                expect(evaluateRule(rule, { hd: 'college.edu' })).toBe(true);
                expect(evaluateRule(rule, { hd: 'company.com' })).toBe(false);
            });
        });

        describe('Missing or undefined claims', () => {
            it('should return false when claim is missing', () => {
                const rule: OidcAuthorizationRule = {
                    claim: 'email',
                    operator: AuthorizationOperator.EQUALS,
                    value: ['user@example.com'],
                };

                expect(evaluateRule(rule, {})).toBe(false);
                expect(evaluateRule(rule, { name: 'John' })).toBe(false);
            });

            it('should return false when claim is null', () => {
                const rule: OidcAuthorizationRule = {
                    claim: 'email',
                    operator: AuthorizationOperator.EQUALS,
                    value: ['user@example.com'],
                };

                expect(evaluateRule(rule, { email: null })).toBe(false);
            });

            it('should return false when claim is undefined', () => {
                const rule: OidcAuthorizationRule = {
                    claim: 'email',
                    operator: AuthorizationOperator.EQUALS,
                    value: ['user@example.com'],
                };

                expect(evaluateRule(rule, { email: undefined })).toBe(false);
            });
        });

        describe('Type coercion', () => {
            it('should convert values to strings for comparison', () => {
                const rule: OidcAuthorizationRule = {
                    claim: 'user_id',
                    operator: AuthorizationOperator.EQUALS,
                    value: ['12345'],
                };

                expect(evaluateRule(rule, { user_id: 12345 })).toBe(true);
                expect(evaluateRule(rule, { user_id: '12345' })).toBe(true);
            });

            it('should handle boolean values', () => {
                const rule: OidcAuthorizationRule = {
                    claim: 'is_admin',
                    operator: AuthorizationOperator.EQUALS,
                    value: ['true'],
                };

                expect(evaluateRule(rule, { is_admin: true })).toBe(true);
                expect(evaluateRule(rule, { is_admin: 'true' })).toBe(true);
                expect(evaluateRule(rule, { is_admin: false })).toBe(false);
            });
        });

        describe('Multiple rules evaluation', () => {
            // Access the private method through any type casting for testing
            const evaluateAuthorizationRules = (
                rules: OidcAuthorizationRule[],
                claims: any
            ): boolean => {
                return (service as any).evaluateAuthorizationRules(rules, claims);
            };

            it('should require ANY rule to pass (OR logic)', () => {
                const rules: OidcAuthorizationRule[] = [
                    {
                        claim: 'email',
                        operator: AuthorizationOperator.ENDS_WITH,
                        value: ['@company.com'],
                    },
                    {
                        claim: 'department',
                        operator: AuthorizationOperator.EQUALS,
                        value: ['engineering', 'development'],
                    },
                ];

                // Both rules pass
                expect(
                    evaluateAuthorizationRules(rules, {
                        email: 'user@company.com',
                        department: 'engineering',
                    })
                ).toBe(true);

                // Only email rule passes
                expect(
                    evaluateAuthorizationRules(rules, {
                        email: 'user@company.com',
                        department: 'marketing',
                    })
                ).toBe(true);

                // Only department rule passes
                expect(
                    evaluateAuthorizationRules(rules, {
                        email: 'user@other.com',
                        department: 'engineering',
                    })
                ).toBe(true);

                // Neither rule passes
                expect(
                    evaluateAuthorizationRules(rules, {
                        email: 'user@other.com',
                        department: 'marketing',
                    })
                ).toBe(false);
            });

            it('should return false when no rules are defined', () => {
                expect(evaluateAuthorizationRules([], { email: 'any@email.com' })).toBe(false);
            });
        });

        describe('Real-world scenarios', () => {
            it('should authorize Google Workspace users by domain', () => {
                const rule: OidcAuthorizationRule = {
                    claim: 'hd',
                    operator: AuthorizationOperator.EQUALS,
                    value: ['company.com'],
                };

                expect(evaluateRule(rule, { hd: 'company.com', email: 'user@company.com' })).toBe(true);
                expect(evaluateRule(rule, { hd: 'other.com', email: 'user@other.com' })).toBe(false);
            });

            it('should authorize users by email domain pattern', () => {
                const rule: OidcAuthorizationRule = {
                    claim: 'email',
                    operator: AuthorizationOperator.ENDS_WITH,
                    value: ['@company.com', '@subsidiary.company.com'],
                };

                expect(evaluateRule(rule, { email: 'john@company.com' })).toBe(true);
                expect(evaluateRule(rule, { email: 'jane@subsidiary.company.com' })).toBe(true);
                expect(evaluateRule(rule, { email: 'external@gmail.com' })).toBe(false);
            });

            it('should authorize specific users by subject ID', () => {
                const rule: OidcAuthorizationRule = {
                    claim: 'sub',
                    operator: AuthorizationOperator.EQUALS,
                    value: ['user123', 'user456', 'user789'],
                };

                expect(evaluateRule(rule, { sub: 'user456' })).toBe(true);
                expect(evaluateRule(rule, { sub: 'user999' })).toBe(false);
            });

            it('should authorize users in specific groups', () => {
                const rule: OidcAuthorizationRule = {
                    claim: 'groups',
                    operator: AuthorizationOperator.CONTAINS,
                    value: ['admin', 'developer'],
                };

                // When groups is a string containing the role
                expect(evaluateRule(rule, { groups: 'user,admin,viewer' })).toBe(true);
                expect(evaluateRule(rule, { groups: 'developer,tester' })).toBe(true);
                expect(evaluateRule(rule, { groups: 'user,viewer' })).toBe(false);
            });
        });
    });

    describe('checkAuthorization', () => {
        // Access the private method through any type casting for testing
        const checkAuthorization = async (provider: OidcProvider, claims: any): Promise<void> => {
            return (service as any).checkAuthorization(provider, claims);
        };

        it('should throw error when no authorization rules are configured', async () => {
            const provider: OidcProvider = {
                id: 'test',
                name: 'Test Provider',
                clientId: 'test-client',
                issuer: 'https://test.com',
                scopes: ['openid'],
                authorizationRules: [],
            } as OidcProvider;

            await expect(checkAuthorization(provider, { sub: 'user123' })).rejects.toThrow(
                new UnauthorizedException(
                    'Login failed: The Test Provider provider has no authorization rules configured. ' +
                        'Please configure authorization rules.'
                )
            );
        });

        it('should throw error when authorization rules do not match', async () => {
            const provider: OidcProvider = {
                id: 'test',
                name: 'Test Provider',
                clientId: 'test-client',
                issuer: 'https://test.com',
                scopes: ['openid'],
                authorizationRules: [
                    {
                        claim: 'email',
                        operator: AuthorizationOperator.ENDS_WITH,
                        value: ['@company.com'],
                    },
                ],
            } as OidcProvider;

            await expect(checkAuthorization(provider, { email: 'user@other.com' })).rejects.toThrow(
                new UnauthorizedException(
                    'Access denied: Your account does not meet the authorization requirements for Test Provider.'
                )
            );
        });

        it('should not throw when authorization rules match', async () => {
            const provider: OidcProvider = {
                id: 'test',
                name: 'Test Provider',
                clientId: 'test-client',
                issuer: 'https://test.com',
                scopes: ['openid'],
                authorizationRules: [
                    {
                        claim: 'email',
                        operator: AuthorizationOperator.ENDS_WITH,
                        value: ['@company.com'],
                    },
                ],
            } as OidcProvider;

            await expect(
                checkAuthorization(provider, { email: 'user@company.com' })
            ).resolves.toBeUndefined();
        });

        it('should authorize when ANY rule matches (OR logic)', async () => {
            const provider: OidcProvider = {
                id: 'test',
                name: 'Test Provider',
                clientId: 'test-client',
                issuer: 'https://test.com',
                scopes: ['openid'],
                authorizationRules: [
                    {
                        claim: 'email',
                        operator: AuthorizationOperator.ENDS_WITH,
                        value: ['@company.com'],
                    },
                    {
                        claim: 'email',
                        operator: AuthorizationOperator.ENDS_WITH,
                        value: ['@partner.com'],
                    },
                    {
                        claim: 'sub',
                        operator: AuthorizationOperator.EQUALS,
                        value: ['specific-user-id'],
                    },
                ],
            } as OidcProvider;

            // Should pass with @partner.com email (second rule)
            await expect(
                checkAuthorization(provider, { email: 'user@partner.com', sub: 'other-id' })
            ).resolves.toBeUndefined();

            // Should pass with specific sub (third rule)
            await expect(
                checkAuthorization(provider, { email: 'user@external.com', sub: 'specific-user-id' })
            ).resolves.toBeUndefined();

            // Should fail when no rules match
            await expect(
                checkAuthorization(provider, { email: 'user@external.com', sub: 'other-id' })
            ).rejects.toThrow();
        });
    });
});
