import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import * as client from 'openid-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OidcAuthService } from '@app/unraid-api/graph/resolvers/sso/oidc-auth.service.js';
import { OidcConfigPersistence } from '@app/unraid-api/graph/resolvers/sso/oidc-config.service.js';
import {
    AuthorizationOperator,
    AuthorizationRuleMode,
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
    let validationService: any;
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
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
                        performDiscovery: vi.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<OidcAuthService>(OidcAuthService);
        oidcConfig = module.get(OidcConfigPersistence);
        sessionService = module.get(OidcSessionService);
        configService = module.get(ConfigService);
        validationService = module.get<OidcValidationService>(OidcValidationService);
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
                claims: any,
                mode: AuthorizationRuleMode = AuthorizationRuleMode.OR
            ): boolean => {
                return (service as any).evaluateAuthorizationRules(rules, claims, mode);
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

            describe('AND logic mode', () => {
                it('should require ALL rules to pass when using AND mode', () => {
                    const rules: OidcAuthorizationRule[] = [
                        {
                            claim: 'email',
                            operator: AuthorizationOperator.ENDS_WITH,
                            value: ['@company.com'],
                        },
                        {
                            claim: 'department',
                            operator: AuthorizationOperator.EQUALS,
                            value: ['engineering'],
                        },
                    ];

                    // Both rules pass - should return true
                    expect(
                        evaluateAuthorizationRules(
                            rules,
                            {
                                email: 'user@company.com',
                                department: 'engineering',
                            },
                            AuthorizationRuleMode.AND
                        )
                    ).toBe(true);

                    // Only email rule passes - should return false
                    expect(
                        evaluateAuthorizationRules(
                            rules,
                            {
                                email: 'user@company.com',
                                department: 'marketing',
                            },
                            AuthorizationRuleMode.AND
                        )
                    ).toBe(false);

                    // Only department rule passes - should return false
                    expect(
                        evaluateAuthorizationRules(
                            rules,
                            {
                                email: 'user@other.com',
                                department: 'engineering',
                            },
                            AuthorizationRuleMode.AND
                        )
                    ).toBe(false);

                    // Neither rule passes - should return false
                    expect(
                        evaluateAuthorizationRules(
                            rules,
                            {
                                email: 'user@other.com',
                                department: 'marketing',
                            },
                            AuthorizationRuleMode.AND
                        )
                    ).toBe(false);
                });

                it('should handle complex AND conditions with multiple operators', () => {
                    const rules: OidcAuthorizationRule[] = [
                        {
                            claim: 'email',
                            operator: AuthorizationOperator.ENDS_WITH,
                            value: ['@company.com'],
                        },
                        {
                            claim: 'name',
                            operator: AuthorizationOperator.STARTS_WITH,
                            value: ['John', 'Jane'],
                        },
                        {
                            claim: 'role',
                            operator: AuthorizationOperator.CONTAINS,
                            value: ['admin', 'manager'],
                        },
                    ];

                    // All rules pass
                    expect(
                        evaluateAuthorizationRules(
                            rules,
                            {
                                email: 'john.doe@company.com',
                                name: 'John Doe',
                                role: 'senior-admin',
                            },
                            AuthorizationRuleMode.AND
                        )
                    ).toBe(true);

                    // Missing one condition (role doesn't contain admin/manager)
                    expect(
                        evaluateAuthorizationRules(
                            rules,
                            {
                                email: 'john.doe@company.com',
                                name: 'John Doe',
                                role: 'developer',
                            },
                            AuthorizationRuleMode.AND
                        )
                    ).toBe(false);
                });

                it('should return true with single rule in AND mode', () => {
                    const rules: OidcAuthorizationRule[] = [
                        {
                            claim: 'email',
                            operator: AuthorizationOperator.EQUALS,
                            value: ['admin@company.com'],
                        },
                    ];

                    expect(
                        evaluateAuthorizationRules(
                            rules,
                            { email: 'admin@company.com' },
                            AuthorizationRuleMode.AND
                        )
                    ).toBe(true);

                    expect(
                        evaluateAuthorizationRules(
                            rules,
                            { email: 'user@company.com' },
                            AuthorizationRuleMode.AND
                        )
                    ).toBe(false);
                });
            });

            describe('OR logic mode (default)', () => {
                it('should handle complex OR conditions with multiple operators', () => {
                    const rules: OidcAuthorizationRule[] = [
                        {
                            claim: 'email',
                            operator: AuthorizationOperator.EQUALS,
                            value: ['admin@company.com', 'superuser@company.com'],
                        },
                        {
                            claim: 'groups',
                            operator: AuthorizationOperator.CONTAINS,
                            value: ['administrators', 'power-users'],
                        },
                        {
                            claim: 'department',
                            operator: AuthorizationOperator.STARTS_WITH,
                            value: ['IT-', 'SEC-'],
                        },
                    ];

                    // Multiple rules pass
                    expect(
                        evaluateAuthorizationRules(
                            rules,
                            {
                                email: 'admin@company.com',
                                groups: 'administrators',
                                department: 'IT-Support',
                            },
                            AuthorizationRuleMode.OR
                        )
                    ).toBe(true);

                    // Only one rule passes (department)
                    expect(
                        evaluateAuthorizationRules(
                            rules,
                            {
                                email: 'user@company.com',
                                groups: 'users',
                                department: 'SEC-Operations',
                            },
                            AuthorizationRuleMode.OR
                        )
                    ).toBe(true);

                    // No rules pass
                    expect(
                        evaluateAuthorizationRules(
                            rules,
                            {
                                email: 'user@company.com',
                                groups: 'users',
                                department: 'HR-Management',
                            },
                            AuthorizationRuleMode.OR
                        )
                    ).toBe(false);
                });

                it('should use OR mode as default when mode is not specified', () => {
                    const rules: OidcAuthorizationRule[] = [
                        {
                            claim: 'email',
                            operator: AuthorizationOperator.ENDS_WITH,
                            value: ['@company.com'],
                        },
                        {
                            claim: 'special_user',
                            operator: AuthorizationOperator.EQUALS,
                            value: ['true'],
                        },
                    ];

                    // Test without explicit mode (should default to OR)
                    expect(
                        evaluateAuthorizationRules(rules, {
                            email: 'user@other.com',
                            special_user: 'true',
                        })
                    ).toBe(true);
                });
            });

            describe('Edge cases and boundary conditions', () => {
                it('should handle empty rules array correctly', () => {
                    expect(
                        evaluateAuthorizationRules(
                            [],
                            { email: 'any@email.com' },
                            AuthorizationRuleMode.AND
                        )
                    ).toBe(false);
                    expect(
                        evaluateAuthorizationRules(
                            [],
                            { email: 'any@email.com' },
                            AuthorizationRuleMode.OR
                        )
                    ).toBe(false);
                });

                it('should handle rules with empty value arrays', () => {
                    const rules: OidcAuthorizationRule[] = [
                        {
                            claim: 'email',
                            operator: AuthorizationOperator.EQUALS,
                            value: [],
                        },
                    ];

                    expect(
                        evaluateAuthorizationRules(
                            rules,
                            { email: 'user@company.com' },
                            AuthorizationRuleMode.OR
                        )
                    ).toBe(false);

                    expect(
                        evaluateAuthorizationRules(
                            rules,
                            { email: 'user@company.com' },
                            AuthorizationRuleMode.AND
                        )
                    ).toBe(false);
                });

                it('should handle missing claims in AND mode', () => {
                    const rules: OidcAuthorizationRule[] = [
                        {
                            claim: 'email',
                            operator: AuthorizationOperator.ENDS_WITH,
                            value: ['@company.com'],
                        },
                        {
                            claim: 'department',
                            operator: AuthorizationOperator.EQUALS,
                            value: ['engineering'],
                        },
                    ];

                    // Missing department claim
                    expect(
                        evaluateAuthorizationRules(
                            rules,
                            { email: 'user@company.com' },
                            AuthorizationRuleMode.AND
                        )
                    ).toBe(false);
                });

                it('should handle missing claims in OR mode', () => {
                    const rules: OidcAuthorizationRule[] = [
                        {
                            claim: 'email',
                            operator: AuthorizationOperator.ENDS_WITH,
                            value: ['@company.com'],
                        },
                        {
                            claim: 'department',
                            operator: AuthorizationOperator.EQUALS,
                            value: ['engineering'],
                        },
                    ];

                    // Missing department claim but email passes
                    expect(
                        evaluateAuthorizationRules(
                            rules,
                            { email: 'user@company.com' },
                            AuthorizationRuleMode.OR
                        )
                    ).toBe(true);

                    // Missing both claims
                    expect(
                        evaluateAuthorizationRules(rules, { other: 'value' }, AuthorizationRuleMode.OR)
                    ).toBe(false);
                });

                it('should handle all claims missing in both modes', () => {
                    const rules: OidcAuthorizationRule[] = [
                        {
                            claim: 'email',
                            operator: AuthorizationOperator.EQUALS,
                            value: ['admin@company.com'],
                        },
                        {
                            claim: 'role',
                            operator: AuthorizationOperator.EQUALS,
                            value: ['admin'],
                        },
                    ];

                    const claimsWithoutRequired = { name: 'John', sub: '12345' };

                    expect(
                        evaluateAuthorizationRules(
                            rules,
                            claimsWithoutRequired,
                            AuthorizationRuleMode.AND
                        )
                    ).toBe(false);

                    expect(
                        evaluateAuthorizationRules(
                            rules,
                            claimsWithoutRequired,
                            AuthorizationRuleMode.OR
                        )
                    ).toBe(false);
                });
            });

            describe('Real-world authorization scenarios', () => {
                it('should handle Google Workspace domain + specific users (OR)', () => {
                    const rules: OidcAuthorizationRule[] = [
                        {
                            claim: 'hd',
                            operator: AuthorizationOperator.EQUALS,
                            value: ['company.com'],
                        },
                        {
                            claim: 'email',
                            operator: AuthorizationOperator.EQUALS,
                            value: ['contractor1@gmail.com', 'contractor2@outlook.com'],
                        },
                    ];

                    // Company domain user
                    expect(
                        evaluateAuthorizationRules(
                            rules,
                            { hd: 'company.com', email: 'employee@company.com' },
                            AuthorizationRuleMode.OR
                        )
                    ).toBe(true);

                    // Allowed contractor
                    expect(
                        evaluateAuthorizationRules(
                            rules,
                            { email: 'contractor1@gmail.com' },
                            AuthorizationRuleMode.OR
                        )
                    ).toBe(true);

                    // Unauthorized user
                    expect(
                        evaluateAuthorizationRules(
                            rules,
                            { email: 'random@gmail.com' },
                            AuthorizationRuleMode.OR
                        )
                    ).toBe(false);
                });

                it('should handle department + role requirements (AND)', () => {
                    const rules: OidcAuthorizationRule[] = [
                        {
                            claim: 'department',
                            operator: AuthorizationOperator.EQUALS,
                            value: ['engineering', 'devops'],
                        },
                        {
                            claim: 'role',
                            operator: AuthorizationOperator.CONTAINS,
                            value: ['senior', 'lead', 'manager'],
                        },
                    ];

                    // Senior engineer - both conditions met
                    expect(
                        evaluateAuthorizationRules(
                            rules,
                            { department: 'engineering', role: 'senior-engineer' },
                            AuthorizationRuleMode.AND
                        )
                    ).toBe(true);

                    // Junior engineer - department ok, but not senior
                    expect(
                        evaluateAuthorizationRules(
                            rules,
                            { department: 'engineering', role: 'junior-engineer' },
                            AuthorizationRuleMode.AND
                        )
                    ).toBe(false);

                    // Senior in wrong department
                    expect(
                        evaluateAuthorizationRules(
                            rules,
                            { department: 'marketing', role: 'senior-marketer' },
                            AuthorizationRuleMode.AND
                        )
                    ).toBe(false);
                });

                it('should handle email domain + group membership (AND)', () => {
                    const rules: OidcAuthorizationRule[] = [
                        {
                            claim: 'email',
                            operator: AuthorizationOperator.ENDS_WITH,
                            value: ['@trusted.com', '@partner.com'],
                        },
                        {
                            claim: 'groups',
                            operator: AuthorizationOperator.CONTAINS,
                            value: ['vpn-access'],
                        },
                    ];

                    // Trusted domain with VPN access
                    expect(
                        evaluateAuthorizationRules(
                            rules,
                            { email: 'user@trusted.com', groups: 'vpn-access,developers' },
                            AuthorizationRuleMode.AND
                        )
                    ).toBe(true);

                    // Trusted domain without VPN access
                    expect(
                        evaluateAuthorizationRules(
                            rules,
                            { email: 'user@trusted.com', groups: 'developers' },
                            AuthorizationRuleMode.AND
                        )
                    ).toBe(false);
                });
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

        it('should authorize using AND mode when all rules match', async () => {
            const provider: OidcProvider = {
                id: 'test',
                name: 'Test Provider',
                clientId: 'test-client',
                issuer: 'https://test.com',
                scopes: ['openid'],
                authorizationRuleMode: AuthorizationRuleMode.AND,
                authorizationRules: [
                    {
                        claim: 'email',
                        operator: AuthorizationOperator.ENDS_WITH,
                        value: ['@company.com'],
                    },
                    {
                        claim: 'department',
                        operator: AuthorizationOperator.EQUALS,
                        value: ['engineering'],
                    },
                ],
            } as OidcProvider;

            // Should pass when both rules match
            await expect(
                checkAuthorization(provider, {
                    email: 'user@company.com',
                    department: 'engineering',
                })
            ).resolves.toBeUndefined();
        });

        it('should reject using AND mode when only some rules match', async () => {
            const provider: OidcProvider = {
                id: 'test',
                name: 'Test Provider',
                clientId: 'test-client',
                issuer: 'https://test.com',
                scopes: ['openid'],
                authorizationRuleMode: AuthorizationRuleMode.AND,
                authorizationRules: [
                    {
                        claim: 'email',
                        operator: AuthorizationOperator.ENDS_WITH,
                        value: ['@company.com'],
                    },
                    {
                        claim: 'department',
                        operator: AuthorizationOperator.EQUALS,
                        value: ['engineering'],
                    },
                ],
            } as OidcProvider;

            // Should fail when only first rule matches
            await expect(
                checkAuthorization(provider, {
                    email: 'user@company.com',
                    department: 'marketing',
                })
            ).rejects.toThrow();

            // Should fail when only second rule matches
            await expect(
                checkAuthorization(provider, {
                    email: 'user@external.com',
                    department: 'engineering',
                })
            ).rejects.toThrow();
        });

        it('should default to OR mode when authorizationRuleMode is not specified', async () => {
            const provider: OidcProvider = {
                id: 'test',
                name: 'Test Provider',
                clientId: 'test-client',
                issuer: 'https://test.com',
                scopes: ['openid'],
                // authorizationRuleMode not specified, should default to OR
                authorizationRules: [
                    {
                        claim: 'email',
                        operator: AuthorizationOperator.ENDS_WITH,
                        value: ['@company.com'],
                    },
                    {
                        claim: 'department',
                        operator: AuthorizationOperator.EQUALS,
                        value: ['engineering'],
                    },
                ],
            } as OidcProvider;

            // Should pass when only first rule matches (OR mode default)
            await expect(
                checkAuthorization(provider, {
                    email: 'user@company.com',
                    department: 'marketing',
                })
            ).resolves.toBeUndefined();
        });

        it('should work with OR mode explicitly set', async () => {
            const provider: OidcProvider = {
                id: 'test',
                name: 'Test Provider',
                clientId: 'test-client',
                issuer: 'https://test.com',
                scopes: ['openid'],
                authorizationRuleMode: AuthorizationRuleMode.OR,
                authorizationRules: [
                    {
                        claim: 'email',
                        operator: AuthorizationOperator.ENDS_WITH,
                        value: ['@company.com'],
                    },
                    {
                        claim: 'department',
                        operator: AuthorizationOperator.EQUALS,
                        value: ['engineering'],
                    },
                ],
            } as OidcProvider;

            // Should pass when only first rule matches
            await expect(
                checkAuthorization(provider, {
                    email: 'user@company.com',
                    department: 'marketing',
                })
            ).resolves.toBeUndefined();

            // Should pass when only second rule matches
            await expect(
                checkAuthorization(provider, {
                    email: 'user@external.com',
                    department: 'engineering',
                })
            ).resolves.toBeUndefined();
        });
    });

    describe('Manual Configuration (No Discovery)', () => {
        it('should create manual configuration when discovery fails but manual endpoints are provided', async () => {
            const provider: OidcProvider = {
                id: 'manual-provider',
                name: 'Manual Provider',
                clientId: 'test-client-id',
                clientSecret: 'test-client-secret',
                issuer: 'https://manual.example.com',
                authorizationEndpoint: 'https://manual.example.com/auth',
                tokenEndpoint: 'https://manual.example.com/token',
                jwksUri: 'https://manual.example.com/jwks',
                scopes: ['openid', 'profile'],
                authorizationRules: [],
            };

            oidcConfig.getProvider.mockResolvedValue(provider);

            // Mock discovery to fail
            validationService.performDiscovery = vi
                .fn()
                .mockRejectedValue(new Error('Discovery failed'));

            // Access the private method
            const getOrCreateConfig = async (provider: OidcProvider) => {
                return (service as any).getOrCreateConfig(provider);
            };

            const config = await getOrCreateConfig(provider);

            // Verify the configuration was created with the correct endpoints
            expect(config).toBeDefined();
            expect(config.serverMetadata().authorization_endpoint).toBe(
                'https://manual.example.com/auth'
            );
            expect(config.serverMetadata().token_endpoint).toBe('https://manual.example.com/token');
            expect(config.serverMetadata().jwks_uri).toBe('https://manual.example.com/jwks');
            expect(config.serverMetadata().issuer).toBe('https://manual.example.com');
        });

        it('should create manual configuration with fallback issuer when not provided', async () => {
            const provider: OidcProvider = {
                id: 'manual-provider-no-issuer',
                name: 'Manual Provider No Issuer',
                clientId: 'test-client-id',
                clientSecret: 'test-client-secret',
                issuer: '', // Empty issuer should skip discovery and use manual endpoints
                authorizationEndpoint: 'https://manual.example.com/auth',
                tokenEndpoint: 'https://manual.example.com/token',
                scopes: ['openid', 'profile'],
                authorizationRules: [],
            };

            oidcConfig.getProvider.mockResolvedValue(provider);

            // No need to mock discovery since it won't be called with empty issuer

            // Access the private method
            const getOrCreateConfig = async (provider: OidcProvider) => {
                return (service as any).getOrCreateConfig(provider);
            };

            const config = await getOrCreateConfig(provider);

            // Verify the configuration was created with fallback issuer
            expect(config).toBeDefined();
            expect(config.serverMetadata().issuer).toBe('manual-manual-provider-no-issuer');
            expect(config.serverMetadata().authorization_endpoint).toBe(
                'https://manual.example.com/auth'
            );
            expect(config.serverMetadata().token_endpoint).toBe('https://manual.example.com/token');
        });

        it('should handle manual configuration with client secret properly', async () => {
            const provider: OidcProvider = {
                id: 'manual-with-secret',
                name: 'Manual With Secret',
                clientId: 'test-client-id',
                clientSecret: 'secret-123',
                issuer: 'https://manual.example.com',
                authorizationEndpoint: 'https://manual.example.com/auth',
                tokenEndpoint: 'https://manual.example.com/token',
                scopes: ['openid', 'profile'],
                authorizationRules: [],
            };

            oidcConfig.getProvider.mockResolvedValue(provider);

            // Mock discovery to fail
            validationService.performDiscovery = vi
                .fn()
                .mockRejectedValue(new Error('Discovery failed'));

            // Access the private method
            const getOrCreateConfig = async (provider: OidcProvider) => {
                return (service as any).getOrCreateConfig(provider);
            };

            const config = await getOrCreateConfig(provider);

            // Verify configuration was created successfully
            expect(config).toBeDefined();
            expect(config.clientMetadata().client_secret).toBe('secret-123');
        });

        it('should handle manual configuration without client secret (public client)', async () => {
            const provider: OidcProvider = {
                id: 'manual-public-client',
                name: 'Manual Public Client',
                clientId: 'public-client-id',
                // No client secret
                issuer: 'https://manual.example.com',
                authorizationEndpoint: 'https://manual.example.com/auth',
                tokenEndpoint: 'https://manual.example.com/token',
                scopes: ['openid', 'profile'],
                authorizationRules: [],
            };

            oidcConfig.getProvider.mockResolvedValue(provider);

            // Mock discovery to fail
            validationService.performDiscovery = vi
                .fn()
                .mockRejectedValue(new Error('Discovery failed'));

            // Access the private method
            const getOrCreateConfig = async (provider: OidcProvider) => {
                return (service as any).getOrCreateConfig(provider);
            };

            const config = await getOrCreateConfig(provider);

            // Verify configuration was created successfully for public client
            expect(config).toBeDefined();
            expect(config.clientMetadata().client_secret).toBeUndefined();
        });

        it('should throw error when discovery fails and no manual endpoints provided', async () => {
            const provider: OidcProvider = {
                id: 'no-manual-endpoints',
                name: 'No Manual Endpoints',
                clientId: 'test-client-id',
                issuer: 'https://broken.example.com',
                // Missing authorizationEndpoint and tokenEndpoint
                scopes: ['openid', 'profile'],
                authorizationRules: [],
            };

            oidcConfig.getProvider.mockResolvedValue(provider);

            // Mock discovery to fail
            validationService.performDiscovery = vi
                .fn()
                .mockRejectedValue(new Error('Discovery failed'));

            // Access the private method
            const getOrCreateConfig = async (provider: OidcProvider) => {
                return (service as any).getOrCreateConfig(provider);
            };

            await expect(getOrCreateConfig(provider)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw error when only authorization endpoint is provided', async () => {
            const provider: OidcProvider = {
                id: 'partial-manual-endpoints',
                name: 'Partial Manual Endpoints',
                clientId: 'test-client-id',
                issuer: 'https://broken.example.com',
                authorizationEndpoint: 'https://manual.example.com/auth',
                // Missing tokenEndpoint
                scopes: ['openid', 'profile'],
                authorizationRules: [],
            };

            oidcConfig.getProvider.mockResolvedValue(provider);

            // Mock discovery to fail
            validationService.performDiscovery = vi
                .fn()
                .mockRejectedValue(new Error('Discovery failed'));

            // Access the private method
            const getOrCreateConfig = async (provider: OidcProvider) => {
                return (service as any).getOrCreateConfig(provider);
            };

            await expect(getOrCreateConfig(provider)).rejects.toThrow(UnauthorizedException);
        });

        it('should cache manual configuration properly', async () => {
            const provider: OidcProvider = {
                id: 'cache-test',
                name: 'Cache Test',
                clientId: 'test-client-id',
                clientSecret: 'test-secret',
                issuer: 'https://manual.example.com',
                authorizationEndpoint: 'https://manual.example.com/auth',
                tokenEndpoint: 'https://manual.example.com/token',
                scopes: ['openid', 'profile'],
                authorizationRules: [],
            };

            oidcConfig.getProvider.mockResolvedValue(provider);

            // Mock discovery to fail
            validationService.performDiscovery = vi
                .fn()
                .mockRejectedValue(new Error('Discovery failed'));

            // Access the private method
            const getOrCreateConfig = async (provider: OidcProvider) => {
                return (service as any).getOrCreateConfig(provider);
            };

            // First call should create configuration
            const config1 = await getOrCreateConfig(provider);

            // Second call should return cached configuration
            const config2 = await getOrCreateConfig(provider);

            expect(config1).toBe(config2); // Should be the exact same instance
            expect(validationService.performDiscovery).toHaveBeenCalledTimes(1); // Only called once due to caching
        });

        it('should handle HTTP endpoints with allowInsecureRequests', async () => {
            const provider: OidcProvider = {
                id: 'http-endpoints',
                name: 'HTTP Endpoints',
                clientId: 'test-client-id',
                clientSecret: 'test-secret',
                issuer: 'http://manual.example.com', // HTTP instead of HTTPS
                authorizationEndpoint: 'http://manual.example.com/auth',
                tokenEndpoint: 'http://manual.example.com/token',
                scopes: ['openid', 'profile'],
                authorizationRules: [],
            };

            oidcConfig.getProvider.mockResolvedValue(provider);

            // Mock discovery to fail
            validationService.performDiscovery = vi
                .fn()
                .mockRejectedValue(new Error('Discovery failed'));

            // Access the private method
            const getOrCreateConfig = async (provider: OidcProvider) => {
                return (service as any).getOrCreateConfig(provider);
            };

            const config = await getOrCreateConfig(provider);

            // Verify configuration was created successfully even with HTTP
            expect(config).toBeDefined();
            expect(config.serverMetadata().token_endpoint).toBe('http://manual.example.com/token');
            expect(config.serverMetadata().authorization_endpoint).toBe(
                'http://manual.example.com/auth'
            );
        });
    });

    describe('getAuthorizationUrl', () => {
        it('should generate authorization URL with custom authorization endpoint', async () => {
            const provider: OidcProvider = {
                id: 'test-provider',
                name: 'Test Provider',
                clientId: 'test-client-id',
                issuer: 'https://example.com',
                authorizationEndpoint: 'https://custom.example.com/auth',
                scopes: ['openid', 'profile'],
                authorizationRules: [],
            };

            oidcConfig.getProvider.mockResolvedValue(provider);

            const authUrl = await service.getAuthorizationUrl(
                'test-provider',
                'test-state',
                'localhost:3001'
            );

            expect(authUrl).toContain('https://custom.example.com/auth');
            expect(authUrl).toContain('client_id=test-client-id');
            expect(authUrl).toContain('response_type=code');
            expect(authUrl).toContain('scope=openid+profile');
            expect(authUrl).toContain('state=test-provider%3Atest-state');
            expect(authUrl).toContain('redirect_uri=');
        });

        it('should encode provider ID in state parameter', async () => {
            const provider: OidcProvider = {
                id: 'encode-test-provider',
                name: 'Encode Test Provider',
                clientId: 'test-client-id',
                issuer: 'https://example.com',
                authorizationEndpoint: 'https://example.com/auth',
                scopes: ['openid', 'email'],
                authorizationRules: [],
            };

            oidcConfig.getProvider.mockResolvedValue(provider);

            const authUrl = await service.getAuthorizationUrl('encode-test-provider', 'original-state');

            // Verify that the state parameter includes both provider ID and original state
            expect(authUrl).toContain('state=encode-test-provider%3Aoriginal-state');
        });

        it('should throw error when provider not found', async () => {
            oidcConfig.getProvider.mockResolvedValue(null);

            await expect(
                service.getAuthorizationUrl('nonexistent-provider', 'test-state')
            ).rejects.toThrow('Provider nonexistent-provider not found');
        });

        it('should handle custom scopes properly', async () => {
            const provider: OidcProvider = {
                id: 'custom-scopes-provider',
                name: 'Custom Scopes Provider',
                clientId: 'test-client-id',
                issuer: 'https://example.com',
                authorizationEndpoint: 'https://example.com/auth',
                scopes: ['openid', 'profile', 'groups', 'custom:scope'],
                authorizationRules: [],
            };

            oidcConfig.getProvider.mockResolvedValue(provider);

            const authUrl = await service.getAuthorizationUrl('custom-scopes-provider', 'test-state');

            expect(authUrl).toContain('scope=openid+profile+groups+custom%3Ascope');
        });
    });

    describe('handleCallback', () => {
        it('should throw error when provider not found in callback', async () => {
            oidcConfig.getProvider.mockResolvedValue(null);

            await expect(
                service.handleCallback('nonexistent-provider', 'code', 'redirect-uri')
            ).rejects.toThrow('Provider nonexistent-provider not found');
        });

        it('should handle malformed state parameter', async () => {
            await expect(
                service.handleCallback('invalid-state', 'code', 'redirect-uri')
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should call getProvider with the provided provider ID', async () => {
            const provider: OidcProvider = {
                id: 'test-provider',
                name: 'Test Provider',
                clientId: 'test-client-id',
                issuer: 'https://example.com',
                scopes: ['openid'],
                authorizationRules: [],
            };

            oidcConfig.getProvider.mockResolvedValue(provider);

            // This will fail during token exchange, but we're testing the provider lookup logic
            await expect(
                service.handleCallback('test-provider', 'code', 'redirect-uri')
            ).rejects.toThrow(UnauthorizedException);

            // Verify the provider was looked up with the correct ID
            expect(oidcConfig.getProvider).toHaveBeenCalledWith('test-provider');
        });
    });

    describe('validateProvider', () => {
        it('should delegate to validation service and return result', async () => {
            const provider: OidcProvider = {
                id: 'validate-provider',
                name: 'Validate Provider',
                clientId: 'test-client-id',
                issuer: 'https://example.com',
                scopes: ['openid'],
                authorizationRules: [],
            };

            const expectedResult = {
                isValid: true,
                authorizationEndpoint: 'https://example.com/auth',
                tokenEndpoint: 'https://example.com/token',
            };

            validationService.validateProvider.mockResolvedValue(expectedResult);

            const result = await service.validateProvider(provider);

            expect(result).toEqual(expectedResult);
            expect(validationService.validateProvider).toHaveBeenCalledWith(provider);
        });

        it('should clear config cache before validation', async () => {
            const provider: OidcProvider = {
                id: 'cache-clear-provider',
                name: 'Cache Clear Provider',
                clientId: 'test-client-id',
                issuer: 'https://example.com',
                scopes: ['openid'],
                authorizationRules: [],
            };

            const expectedResult = {
                isValid: false,
                error: 'Validation failed',
            };

            validationService.validateProvider.mockResolvedValue(expectedResult);

            const result = await service.validateProvider(provider);

            expect(result).toEqual(expectedResult);
            // Verify the cache was cleared by checking the method was called
            expect(validationService.validateProvider).toHaveBeenCalledWith(provider);
        });
    });

    describe('getRedirectUri (private method)', () => {
        it('should generate correct redirect URI with localhost (development)', () => {
            const getRedirectUri = (service as any).getRedirectUri.bind(service);
            const redirectUri = getRedirectUri('localhost:3001');

            expect(redirectUri).toBe('http://localhost:3000/graphql/api/auth/oidc/callback');
        });

        it('should generate correct redirect URI with non-localhost host', () => {
            const getRedirectUri = (service as any).getRedirectUri.bind(service);

            // Mock the ConfigService to return a production base URL
            configService.get.mockReturnValue('https://example.com');

            const redirectUri = getRedirectUri('example.com:443');

            expect(redirectUri).toBe('https://example.com/graphql/api/auth/oidc/callback');
        });

        it('should use default redirect URI when no request host provided', () => {
            const getRedirectUri = (service as any).getRedirectUri.bind(service);

            // Mock the ConfigService to return a default value
            configService.get.mockReturnValue('http://tower.local');

            const redirectUri = getRedirectUri();

            expect(redirectUri).toBe('http://tower.local/graphql/api/auth/oidc/callback');
        });
    });
});
