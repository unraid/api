import { ConfigService } from '@nestjs/config';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConnectPluginService } from '../unraid-connect/connect-plugin.service.js';
import * as ConnectPluginUtils from '../unraid-connect/connect-plugin.utils.js';

// Mock the utils module
vi.mock('../unraid-connect/connect-plugin.utils.js');

// Mock execa to avoid side effects
vi.mock('execa', () => ({
    execa: vi.fn().mockResolvedValue({ stdout: '', stderr: '' }),
}));

describe('ConnectPluginService', () => {
    let service: ConnectPluginService;
    let configService: ConfigService;

    beforeEach(() => {
        // Mock ConfigService
        configService = {
            get: vi.fn(),
            set: vi.fn(),
        } as unknown as ConfigService;

        service = new ConnectPluginService(configService);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('onModuleDestroy', () => {
        it('should not prune if plugin is installed', async () => {
            // Arrange
            vi.spyOn(ConnectPluginUtils, 'isConnectPluginInstalled').mockReturnValue(true);
            const pruneSpy = vi.spyOn(service, 'pruneStaleConnectPluginEntry');

            // Act
            await service.onModuleDestroy();

            // Assert
            expect(pruneSpy).not.toHaveBeenCalled();
        });

        it('should prune if plugin is not installed', async () => {
            // Arrange
            vi.spyOn(ConnectPluginUtils, 'isConnectPluginInstalled').mockReturnValue(false);
            // We mock the implementation to avoid running the actual pruning logic in this test
            const pruneSpy = vi.spyOn(service, 'pruneStaleConnectPluginEntry').mockResolvedValue(undefined);

            // Act
            await service.onModuleDestroy();

            // Assert
            expect(pruneSpy).toHaveBeenCalledWith({ shouldRestart: false });
        });
    });

    describe('pruneOnStartupIfNecessary', () => {
        it('should not prune if plugin is installed', async () => {
            // Arrange
            vi.spyOn(ConnectPluginUtils, 'isConnectPluginInstalled').mockReturnValue(true);
            const pruneSpy = vi.spyOn(service, 'pruneStaleConnectPluginEntry');

            // Act
            await service.pruneOnStartupIfNecessary();

            // Assert
            expect(pruneSpy).not.toHaveBeenCalled();
        });

        it('should prune if plugin is not installed', async () => {
            // Arrange
            vi.spyOn(ConnectPluginUtils, 'isConnectPluginInstalled').mockReturnValue(false);
            const pruneSpy = vi.spyOn(service, 'pruneStaleConnectPluginEntry').mockResolvedValue(undefined);

            // Act
            await service.pruneOnStartupIfNecessary();

            // Assert
            expect(pruneSpy).toHaveBeenCalledWith({ shouldRestart: true });
        });
    });

    describe('pruneStaleConnectPluginEntry', () => {
        it('should skip pruning if plugin is installed (safety check)', async () => {
            // Arrange
            vi.spyOn(ConnectPluginUtils, 'isConnectPluginInstalled').mockReturnValue(true);
            // Use a spy on logger to verify warning
            const warnSpy = vi.spyOn(service.logger, 'warn');

            // Act
            await service.pruneStaleConnectPluginEntry();

            // Assert
            expect(warnSpy).toHaveBeenCalled();
        });
    });
});
