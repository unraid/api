import { Test } from '@nestjs/testing';

import { CANONICAL_INTERNAL_CLIENT_TOKEN } from '@unraid/shared';
import { describe, expect, it, vi } from 'vitest';

import { ApiReportService } from '@app/unraid-api/cli/api-report.service.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { RestModule } from '@app/unraid-api/rest/rest.module.js';
import { RestService } from '@app/unraid-api/rest/rest.service.js';

// Mock external dependencies that cause issues in tests
vi.mock('@app/store/index.js', () => ({
    store: {
        getState: vi.fn(() => ({
            paths: {
                'log-base': '/tmp/logs',
                'auth-keys': '/tmp/auth-keys',
                config: '/tmp/config',
            },
            emhttp: {},
            dynamix: { notify: { path: '/tmp/notifications' } },
            registration: {},
        })),
        subscribe: vi.fn(() => vi.fn()), // Return unsubscribe function
    },
    getters: {
        paths: vi.fn(() => ({
            'log-base': '/tmp/logs',
            'auth-keys': '/tmp/auth-keys',
            config: '/tmp/config',
        })),
        dynamix: vi.fn(() => ({ notify: { path: '/tmp/notifications' } })),
        emhttp: vi.fn(() => ({})),
        registration: vi.fn(() => ({})),
    },
}));

vi.mock('@app/core/log.js', () => ({
    levels: ['trace', 'debug', 'info', 'warn', 'error', 'fatal'],
    apiLogger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    },
    pluginLogger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        trace: vi.fn(),
        fatal: vi.fn(),
    },
}));

vi.mock('execa', () => ({
    execa: vi.fn().mockResolvedValue({ stdout: 'mocked output' }),
}));

describe('RestModule Integration', () => {
    it('should compile with RestService having access to ApiReportService', async () => {
        const module = await Test.createTestingModule({
            imports: [RestModule],
        })
            // Override services that have complex dependencies for testing
            .overrideProvider(CANONICAL_INTERNAL_CLIENT_TOKEN)
            .useValue({ getClient: vi.fn() })
            .overrideProvider(LogService)
            .useValue({ error: vi.fn(), debug: vi.fn() })
            .compile();

        const restService = module.get<RestService>(RestService);
        const apiReportService = module.get<ApiReportService>(ApiReportService);

        expect(restService).toBeDefined();
        expect(apiReportService).toBeDefined();

        // Verify RestService has the injected ApiReportService
        expect(restService['apiReportService']).toBeDefined();

        await module.close();
    }, 10000);
});
