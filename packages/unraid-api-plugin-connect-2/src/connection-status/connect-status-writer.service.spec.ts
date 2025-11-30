import { ConfigService } from '@nestjs/config';
import { unlink, writeFile } from 'fs/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConfigType } from '../config/connect.config.js';
import { ConnectStatusWriterService } from './connect-status-writer.service.js';

vi.mock('fs/promises', () => ({
    writeFile: vi.fn(),
    unlink: vi.fn(),
}));

describe('ConnectStatusWriterService', () => {
    let service: ConnectStatusWriterService;
    let configService: ConfigService<ConfigType, true>;
    let writeFileMock: ReturnType<typeof vi.fn>;
    let unlinkMock: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        vi.clearAllMocks();
        vi.useFakeTimers();

        writeFileMock = vi.mocked(writeFile);
        unlinkMock = vi.mocked(unlink);

        configService = {
            get: vi.fn().mockReturnValue({
                status: 'CONNECTED',
                error: null,
                lastPing: Date.now(),
            }),
        } as unknown as ConfigService<ConfigType, true>;

        service = new ConnectStatusWriterService(configService);
    });

    afterEach(async () => {
        vi.useRealTimers();
    });

    describe('onApplicationBootstrap', () => {
        it('should write initial status on bootstrap', async () => {
            await service.onApplicationBootstrap();

            expect(writeFileMock).toHaveBeenCalledTimes(1);
            expect(writeFileMock).toHaveBeenCalledWith(
                '/var/local/emhttp/connectStatus.json',
                expect.stringContaining('CONNECTED')
            );
        });

        it('should handle event-driven status changes', async () => {
            await service.onApplicationBootstrap();
            writeFileMock.mockClear();

            // The service uses @OnEvent decorator, so we need to call the method directly
            await service['writeStatus']();

            expect(writeFileMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('write content', () => {
        it('should write correct JSON structure with all fields', async () => {
            const mockMetadata = {
                status: 'CONNECTED',
                error: 'Some error',
                lastPing: 1234567890,
            };
            
            vi.mocked(configService.get).mockReturnValue(mockMetadata);

            await service.onApplicationBootstrap();

            const writeCall = writeFileMock.mock.calls[0];
            const writtenData = JSON.parse(writeCall[1] as string);

            expect(writtenData).toMatchObject({
                connectionStatus: 'CONNECTED',
                error: 'Some error',
                lastPing: 1234567890,
                allowedOrigins: '',
            });
            expect(writtenData.timestamp).toBeDefined();
            expect(typeof writtenData.timestamp).toBe('number');
        });

        it('should handle missing connection metadata', async () => {
            vi.mocked(configService.get).mockReturnValue(undefined);

            await service.onApplicationBootstrap();

            const writeCall = writeFileMock.mock.calls[0];
            const writtenData = JSON.parse(writeCall[1] as string);

            expect(writtenData).toMatchObject({
                connectionStatus: 'PRE_INIT',
                error: null,
                lastPing: null,
                allowedOrigins: '',
            });
        });
    });

    describe('error handling', () => {
        it('should handle write errors gracefully', async () => {
            writeFileMock.mockRejectedValue(new Error('Write failed'));

            await expect(service.onApplicationBootstrap()).resolves.not.toThrow();

            // Test direct write error handling
            await expect(service['writeStatus']()).resolves.not.toThrow();
        });
    });

    describe('cleanup on shutdown', () => {
        it('should delete status file on module destroy', async () => {
            await service.onModuleDestroy();

            expect(unlinkMock).toHaveBeenCalledTimes(1);
            expect(unlinkMock).toHaveBeenCalledWith('/var/local/emhttp/connectStatus.json');
        });

        it('should handle file deletion errors gracefully', async () => {
            unlinkMock.mockRejectedValue(new Error('File not found'));

            await expect(service.onModuleDestroy()).resolves.not.toThrow();

            expect(unlinkMock).toHaveBeenCalledTimes(1);
        });

        it('should ensure file is deleted even if it was never written', async () => {
            // Don't bootstrap (so no file is written)
            await service.onModuleDestroy();

            expect(unlinkMock).toHaveBeenCalledTimes(1);
            expect(unlinkMock).toHaveBeenCalledWith('/var/local/emhttp/connectStatus.json');
        });
    });
});