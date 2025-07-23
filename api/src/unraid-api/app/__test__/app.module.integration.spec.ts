import { Test, TestingModule } from '@nestjs/testing';

import { describe, expect, it, vi } from 'vitest';

import { AppModule } from '@app/unraid-api/app/app.module.js';

vi.mock('@app/core/log.js', () => ({
    levels: ['trace', 'debug', 'info', 'warn', 'error', 'fatal'],
    apiLogger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    },
}));

vi.mock('@app/store/index.js', () => ({
    store: {
        getState: vi.fn(() => ({
            paths: {
                'log-base': '/tmp/logs',
                'auth-keys': '/tmp/auth-keys',
                config: '/tmp/config',
                activationBase: '/tmp/activation',
                'dynamix-config': [null, '/tmp/dynamix-config'],
                identConfig: '/tmp/ident-config',
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
            activationBase: '/tmp/activation',
            'dynamix-config': [null, '/tmp/dynamix-config'],
            identConfig: '/tmp/ident-config',
        })),
        dynamix: vi.fn(() => ({
            notify: { path: '/tmp/notifications' },
        })),
        emhttp: vi.fn(() => ({})),
        registration: vi.fn(() => ({})),
    },
}));

vi.mock('execa', () => ({
    execa: vi.fn().mockResolvedValue({ stdout: 'mocked output' }),
}));

// Mock child_process spawn for RClone and other services
vi.mock('node:child_process', () => ({
    spawn: vi.fn(() => ({
        on: vi.fn(),
        kill: vi.fn(),
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
    })),
}));

// Mock GraphQL directive to avoid module conflicts
vi.mock('@unraid/shared/graphql.model.js', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        // Return simplified mocks for any GraphQL directives
    };
});

describe('AppModule Integration', () => {
    it('should compile without dependency injection errors', async () => {
        // This is a simplified test that just verifies the module can be compiled
        // without trying to initialize all services which causes complex GraphQL issues
        await expect(
            Test.createTestingModule({
                imports: [AppModule],
            }).compile()
        ).resolves.toBeDefined();
    });
});
