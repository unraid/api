import { ConfigService } from '@nestjs/config';
import EventEmitter from 'node:events';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { pubsub } from '@app/core/pubsub.js';
import { PluginInstallStatus } from '@app/unraid-api/graph/resolvers/unraid-plugins/unraid-plugins.model.js';
import { UnraidPluginsService } from '@app/unraid-api/graph/resolvers/unraid-plugins/unraid-plugins.service.js';

class MockExecaProcess extends EventEmitter {
    public readonly all = new PassThrough();
}

const mockExeca = vi.fn<(...args: unknown[]) => MockExecaProcess>();

vi.mock('execa', () => ({
    execa: (...args: unknown[]) => mockExeca(...args),
}));

const flushAsync = async () => {
    await Promise.resolve();
};

describe('UnraidPluginsService', () => {
    let service: UnraidPluginsService;
    let currentProcess: MockExecaProcess;

    beforeEach(() => {
        vi.restoreAllMocks();
        service = new UnraidPluginsService(new ConfigService());
        currentProcess = new MockExecaProcess();
        currentProcess.all.setEncoding('utf-8');
        mockExeca.mockReset();
        mockExeca.mockImplementation(() => currentProcess);
    });

    const emitSuccess = (process: MockExecaProcess, lines: string[]) => {
        lines.forEach((line) => process.all.write(`${line}\n`));
        process.all.end();
        process.emit('close', 0);
    };

    const emitFailure = (process: MockExecaProcess, errorMessage: string) => {
        process.all.write(`${errorMessage}\n`);
        process.all.end();
        process.emit('close', 1);
    };

    it('installs plugin successfully and captures output', async () => {
        const publishSpy = vi.spyOn(pubsub, 'publish');

        const operation = await service.installPlugin({
            url: 'https://example.com/plugin.plg',
            name: 'Example Plugin',
        });

        expect(mockExeca).toHaveBeenCalledWith(
            'plugin',
            ['install', 'https://example.com/plugin.plg', 'forced'],
            {
                all: true,
                reject: false,
                timeout: 5 * 60 * 1000,
            }
        );

        const runningOperation = service.getOperation(operation.id);
        expect(runningOperation?.status).toBe(PluginInstallStatus.RUNNING);

        emitSuccess(currentProcess, ['Downloading package', 'Installation complete']);
        await flushAsync();

        const completedOperation = service.getOperation(operation.id);
        expect(completedOperation?.status).toBe(PluginInstallStatus.SUCCEEDED);
        expect(completedOperation?.output).toEqual(['Downloading package', 'Installation complete']);

        expect(publishSpy).toHaveBeenCalledWith(expect.stringContaining(operation.id), {
            pluginInstallUpdates: expect.objectContaining({
                operationId: operation.id,
                status: PluginInstallStatus.RUNNING,
            }),
        });

        expect(publishSpy).toHaveBeenCalledWith(expect.stringContaining(operation.id), {
            pluginInstallUpdates: expect.objectContaining({
                operationId: operation.id,
                status: PluginInstallStatus.SUCCEEDED,
            }),
        });
    });

    it('marks installation as failed on non-zero exit', async () => {
        const publishSpy = vi.spyOn(pubsub, 'publish');

        const operation = await service.installPlugin({
            url: 'https://example.com/plugin.plg',
            name: 'Broken Plugin',
        });

        emitFailure(currentProcess, 'Installation failed');
        await flushAsync();

        const failedOperation = service.getOperation(operation.id);
        expect(failedOperation?.status).toBe(PluginInstallStatus.FAILED);
        expect(failedOperation?.output.some((line) => line.includes('Installation failed'))).toBe(true);

        expect(publishSpy).toHaveBeenCalledWith(expect.stringContaining(operation.id), {
            pluginInstallUpdates: expect.objectContaining({
                operationId: operation.id,
                status: PluginInstallStatus.FAILED,
            }),
        });
    });

    it('installs language without forced arg and tracks operation list', async () => {
        const operation = await service.installLanguage({
            url: 'https://example.com/language.txz',
            name: 'French',
            forced: true,
        });

        expect(mockExeca).toHaveBeenCalledWith(
            'language',
            ['install', 'https://example.com/language.txz'],
            expect.objectContaining({
                all: true,
                reject: false,
                timeout: 5 * 60 * 1000,
            })
        );

        expect(service.getOperation(operation.id)).toMatchObject({
            id: operation.id,
            status: PluginInstallStatus.RUNNING,
        });
        expect(service.getOperation('missing-operation-id')).toBeNull();
        expect(service.listOperations().map((entry) => entry.id)).toContain(operation.id);
    });

    it('listInstalledPlugins returns plugin files from configured directory', async () => {
        const tempDir = await mkdtemp(join(tmpdir(), 'unraid-plugins-test-'));
        try {
            const pluginsDir = join(tempDir, 'plugins');
            const dynamixBase = join(pluginsDir, 'dynamix');
            await mkdir(dynamixBase, { recursive: true });
            await writeFile(join(pluginsDir, 'community.applications.plg'), 'plugin-data');
            await writeFile(join(pluginsDir, 'README.txt'), 'not-a-plugin');

            const configService = {
                get: vi.fn().mockReturnValue({
                    'dynamix-base': dynamixBase,
                }),
            } as unknown as ConfigService;
            const configuredService = new UnraidPluginsService(configService);

            const result = await configuredService.listInstalledPlugins();
            expect(result).toEqual(['community.applications.plg']);
        } finally {
            await rm(tempDir, { recursive: true, force: true });
        }
    });

    it('listInstalledPlugins returns empty array when plugin directory is missing', async () => {
        const configService = {
            get: vi.fn().mockReturnValue({
                'dynamix-base': '/tmp/definitely-missing-dynamix-base',
            }),
        } as unknown as ConfigService;
        const configuredService = new UnraidPluginsService(configService);

        await expect(configuredService.listInstalledPlugins()).resolves.toEqual([]);
    });

    it('removes completed operations after retention ttl', async () => {
        vi.useFakeTimers();
        try {
            const ttlConfigService = {
                get: vi.fn((key: string, defaultValue: unknown) => {
                    if (key === 'plugins.installOperationRetentionMs') {
                        return 1_000;
                    }
                    return defaultValue;
                }),
            } as unknown as ConfigService;
            const serviceWithShortTtl = new UnraidPluginsService(ttlConfigService);

            const processWithShortTtl = new MockExecaProcess();
            processWithShortTtl.all.setEncoding('utf-8');
            mockExeca.mockImplementation(() => processWithShortTtl as unknown as any);

            const operation = await serviceWithShortTtl.installPlugin({
                url: 'https://example.com/plugin.plg',
                name: 'Cleanup Test Plugin',
            });

            emitSuccess(processWithShortTtl, ['done']);
            await flushAsync();

            expect(serviceWithShortTtl.getOperation(operation.id)).toBeTruthy();

            await vi.advanceTimersByTimeAsync(1_001);

            expect(serviceWithShortTtl.getOperation(operation.id)).toBeNull();
        } finally {
            vi.useRealTimers();
        }
    });
});
