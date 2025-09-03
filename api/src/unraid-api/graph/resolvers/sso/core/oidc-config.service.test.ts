import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { UserSettingsService } from '@unraid/shared/services/user-settings.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OidcConfigPersistence } from '@app/unraid-api/graph/resolvers/sso/core/oidc-config.service.js';
import { OidcValidationService } from '@app/unraid-api/graph/resolvers/sso/core/oidc-validation.service.js';
import { OidcUrlPatterns } from '@app/unraid-api/graph/resolvers/sso/utils/oidc-url-patterns.util.js';

describe('OidcConfigPersistence', () => {
    let service: OidcConfigPersistence;
    let mockConfigService: ConfigService;
    let mockUserSettingsService: UserSettingsService;
    let mockValidationService: OidcValidationService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OidcConfigPersistence,
                {
                    provide: ConfigService,
                    useValue: {
                        get: vi.fn(),
                        set: vi.fn(),
                    },
                },
                {
                    provide: UserSettingsService,
                    useValue: {
                        register: vi.fn(),
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

        service = module.get<OidcConfigPersistence>(OidcConfigPersistence);
        mockConfigService = module.get<ConfigService>(ConfigService);
        mockUserSettingsService = module.get<UserSettingsService>(UserSettingsService);
        mockValidationService = module.get<OidcValidationService>(OidcValidationService);

        // Mock persist method to avoid file system operations
        vi.spyOn(service, 'persist').mockResolvedValue();
    });

    describe('URL validation integration', () => {
        it('should validate issuer URLs using the shared utility', () => {
            // Test that our shared utility correctly validates URLs
            // This ensures the pattern we use in the form schema works correctly
            const examples = OidcUrlPatterns.getExamples();

            // Test valid URLs
            examples.valid.forEach((url) => {
                expect(OidcUrlPatterns.isValidIssuerUrl(url)).toBe(true, `${url} should be valid`);
            });

            // Test invalid URLs
            examples.invalid.forEach((url) => {
                expect(OidcUrlPatterns.isValidIssuerUrl(url)).toBe(false, `${url} should be invalid`);
            });
        });

        it('should validate the pattern constant matches the regex', () => {
            // Ensure the pattern string can be compiled into a valid regex
            expect(() => new RegExp(OidcUrlPatterns.ISSUER_URL_PATTERN)).not.toThrow();

            // Ensure the static regex matches the pattern
            const manualRegex = new RegExp(OidcUrlPatterns.ISSUER_URL_PATTERN);
            expect(OidcUrlPatterns.ISSUER_URL_REGEX.source).toBe(manualRegex.source);
        });

        it('should reject the specific URL from the bug report', () => {
            // Test the exact scenario that caused the original bug
            const problematicUrl = 'https://accounts.google.com/';
            const correctUrl = 'https://accounts.google.com';

            expect(OidcUrlPatterns.isValidIssuerUrl(problematicUrl)).toBe(
                false,
                'The problematic URL from the bug report should be rejected'
            );
            expect(OidcUrlPatterns.isValidIssuerUrl(correctUrl)).toBe(
                true,
                'The correct URL should be accepted'
            );
        });
    });
});
