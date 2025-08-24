import { Test, TestingModule } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LogsService } from '@app/unraid-api/graph/resolvers/logs/logs.service.js';
import { SubscriptionTrackerService } from '@app/unraid-api/graph/services/subscription-tracker.service.js';

describe('LogsService', () => {
    let service: LogsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LogsService,
                {
                    provide: SubscriptionTrackerService,
                    useValue: {
                        getSubscriberCount: vi.fn().mockReturnValue(0),
                        registerTopic: vi.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<LogsService>(LogsService);
    });

    describe('filterContent', () => {
        it('should filter lines containing OIDC case-insensitively', () => {
            const content = `[2024-01-01 10:00:00] [INFO] Starting server
[2024-01-01 10:00:01] [INFO] [OidcAuthService] Initializing OIDC authentication
[2024-01-01 10:00:02] [ERROR] [OidcValidationService] Validation failed for provider google
[2024-01-01 10:00:03] [DEBUG] Processing request
[2024-01-01 10:00:04] [WARN] [oidc-config] Configuration updated
[2024-01-01 10:00:05] [INFO] Request completed`;

            // Access private method via any cast for testing
            const filteredContent = (service as any).filterContent(content, 'OIDC');

            const filteredLines = filteredContent.split('\n').filter((line: string) => line.trim());

            // Should include all lines with OIDC, Oidc, or oidc
            expect(filteredLines).toHaveLength(3);
            expect(filteredLines[0]).toContain('OidcAuthService');
            expect(filteredLines[1]).toContain('OidcValidationService');
            expect(filteredLines[2]).toContain('oidc-config');
        });

        it('should handle ERROR logs from OidcValidationService', () => {
            const content = `[17:20:59 ERROR]: [OidcValidationService] Validation failed for provider google: fetch failed {"apiVersion":"4.15.1+277379e","logger":"OidcValidationService","context":"OidcValidationService"}
[17:21:00 INFO]: [SomeOtherService] Processing request
[17:21:01 ERROR]: [OidcAuthService] Authentication failed`;

            const filteredContent = (service as any).filterContent(content, 'OIDC');
            const filteredLines = filteredContent.split('\n').filter((line: string) => line.trim());

            // Should include both OIDC service lines
            expect(filteredLines).toHaveLength(2);
            expect(filteredLines[0]).toContain('OidcValidationService');
            expect(filteredLines[0]).toContain('ERROR');
            expect(filteredLines[1]).toContain('OidcAuthService');
        });

        it('should handle ANSI color codes in filtered content', () => {
            const content = `\x1b[36m[OidcValidationService] Starting discovery for provider unraid.net {"apiVersion":"4.15.1+277379e","logger":"OidcValidationService","context":"OidcValidationService"}\x1b[0m
\x1b[32m[SomeOtherService] Processing request\x1b[0m
\x1b[31m[OidcAuthService] Error occurred\x1b[0m`;

            const filteredContent = (service as any).filterContent(content, 'OIDC');
            const filteredLines = filteredContent.split('\n').filter((line: string) => line.trim());

            // Should include OIDC lines with ANSI codes intact
            expect(filteredLines).toHaveLength(2);
            expect(filteredLines[0]).toContain('\x1b[36m'); // Cyan color code
            expect(filteredLines[0]).toContain('OidcValidationService');
            expect(filteredLines[1]).toContain('\x1b[31m'); // Red color code
            expect(filteredLines[1]).toContain('OidcAuthService');
        });

        it('should return empty string when no lines match filter', () => {
            const content = `[2024-01-01 10:00:00] [INFO] Starting server
[2024-01-01 10:00:01] [INFO] Processing request
[2024-01-01 10:00:02] [INFO] Request completed`;

            const filteredContent = (service as any).filterContent(content, 'OIDC');

            // Should be empty or only contain empty lines
            const filteredLines = filteredContent.split('\n').filter((line: string) => line.trim());
            expect(filteredLines).toHaveLength(0);
        });

        it('should handle mixed case in service names', () => {
            const content = `[INFO] [oidcService] Lower case service
[INFO] [OIDCManager] Upper case service
[INFO] [OidcProvider] Mixed case service
[INFO] [NonMatchingService] Should not appear`;

            const filteredContent = (service as any).filterContent(content, 'oidc');
            const filteredLines = filteredContent.split('\n').filter((line: string) => line.trim());

            // Case-insensitive matching should get all OIDC variants
            expect(filteredLines).toHaveLength(3);
            expect(filteredLines[0]).toContain('oidcService');
            expect(filteredLines[1]).toContain('OIDCManager');
            expect(filteredLines[2]).toContain('OidcProvider');
        });
    });
});
