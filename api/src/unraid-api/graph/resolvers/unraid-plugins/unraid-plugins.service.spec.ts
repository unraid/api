import EventEmitter from 'node:events';
import { PassThrough } from 'node:stream';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { pubsub } from '@app/core/pubsub.js';
import { PluginInstallStatus } from '@app/unraid-api/graph/resolvers/unraid-plugins/unraid-plugins.model.js';
import { UnraidPluginsService } from '@app/unraid-api/graph/resolvers/unraid-plugins/unraid-plugins.service.js';

class MockExecaProcess extends EventEmitter {
    public readonly all = new PassThrough();
}

const mockExeca = vi.fn();

vi.mock('execa', () => ({
    execa: (...args: unknown[]) => mockExeca(...args),
}));

const flushAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('UnraidPluginsService', () => {
    let service: UnraidPluginsService;
    let currentProcess: MockExecaProcess;

    beforeEach(() => {
        service = new UnraidPluginsService();
        currentProcess = new MockExecaProcess();
        currentProcess.all.setEncoding('utf-8');
        mockExeca.mockReset();
        mockExeca.mockImplementation(() => currentProcess as unknown as any);
        vi.spyOn(pubsub, 'publish').mockClear();
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
});
