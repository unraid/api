import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    UPSCableType,
    UPSConfigInput,
    UPSKillPower,
    UPSServiceState,
    UPSType,
} from '@app/unraid-api/graph/resolvers/ups/ups.inputs.js';
import { UPSService } from '@app/unraid-api/graph/resolvers/ups/ups.service.js';

// Mock dependencies
vi.mock('execa');
vi.mock('fs/promises');
vi.mock('@app/core/utils/files/file-exists.js');

const mockExeca = vi.mocked((await import('execa')).execa);
const mockReadFile = vi.mocked((await import('fs/promises')).readFile);
const mockWriteFile = vi.mocked((await import('fs/promises')).writeFile);
const mockFileExistsSync = vi.mocked(
    (await import('@app/core/utils/files/file-exists.js')).fileExistsSync
);

describe('UPSService', () => {
    let service: UPSService;

    const mockCurrentConfig = {
        SERVICE: 'disable',
        UPSCABLE: 'usb',
        UPSTYPE: 'usb',
        DEVICE: '/dev/ttyUSB0',
        BATTERYLEVEL: 20,
        MINUTES: 15,
        TIMEOUT: 30,
        KILLUPS: 'no',
        NISIP: '0.0.0.0',
        NETSERVER: 'off',
        UPSNAME: 'MyUPS',
        MODELNAME: 'APC UPS',
    };

    beforeEach(async () => {
        vi.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [UPSService],
        }).compile();

        service = module.get<UPSService>(UPSService);

        // Mock logger methods on the service instance
        vi.spyOn(service['logger'], 'debug').mockImplementation(() => {});
        vi.spyOn(service['logger'], 'warn').mockImplementation(() => {});
        vi.spyOn(service['logger'], 'error').mockImplementation(() => {});

        // Default mocks
        mockFileExistsSync.mockReturnValue(true);
        mockReadFile.mockResolvedValue('SERVICE disable\nUPSCABLE usb\nUPSTYPE usb\n');
        mockWriteFile.mockResolvedValue(undefined);
        mockExeca.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 } as any);

        // Mock getCurrentConfig to return our test config
        vi.spyOn(service, 'getCurrentConfig').mockResolvedValue(mockCurrentConfig);
    });

    describe('configureUPS', () => {
        it('should merge partial config with existing values', async () => {
            const partialConfig: UPSConfigInput = {
                batteryLevel: 25,
                minutes: 10,
            };

            await service.configureUPS(partialConfig);

            // Should preserve existing values for fields not provided
            expect(mockWriteFile).toHaveBeenCalledWith(
                '/etc/apcupsd/apcupsd.conf',
                expect.stringContaining('SERVICE disable'), // preserved from existing
                'utf-8'
            );
            expect(mockWriteFile).toHaveBeenCalledWith(
                '/etc/apcupsd/apcupsd.conf',
                expect.stringContaining('UPSTYPE usb'), // preserved from existing
                'utf-8'
            );
            expect(mockWriteFile).toHaveBeenCalledWith(
                '/etc/apcupsd/apcupsd.conf',
                expect.stringContaining('BATTERYLEVEL 25'), // updated value
                'utf-8'
            );
            expect(mockWriteFile).toHaveBeenCalledWith(
                '/etc/apcupsd/apcupsd.conf',
                expect.stringContaining('MINUTES 10'), // updated value
                'utf-8'
            );
        });

        it('should use default values when neither input nor existing config provide values', async () => {
            // Mock getCurrentConfig to return empty config
            vi.spyOn(service, 'getCurrentConfig').mockResolvedValue({});

            const partialConfig: UPSConfigInput = {
                service: UPSServiceState.ENABLE,
            };

            await service.configureUPS(partialConfig);

            expect(mockWriteFile).toHaveBeenCalledWith(
                '/etc/apcupsd/apcupsd.conf',
                expect.stringContaining('SERVICE enable'), // provided value
                'utf-8'
            );
            expect(mockWriteFile).toHaveBeenCalledWith(
                '/etc/apcupsd/apcupsd.conf',
                expect.stringContaining('UPSTYPE usb'), // default value
                'utf-8'
            );
            expect(mockWriteFile).toHaveBeenCalledWith(
                '/etc/apcupsd/apcupsd.conf',
                expect.stringContaining('BATTERYLEVEL 10'), // default value
                'utf-8'
            );
        });

        it('should handle custom cable configuration', async () => {
            const config: UPSConfigInput = {
                upsCable: UPSCableType.CUSTOM,
                customUpsCable: 'custom-config-string',
            };

            await service.configureUPS(config);

            expect(mockWriteFile).toHaveBeenCalledWith(
                '/etc/apcupsd/apcupsd.conf',
                expect.stringContaining('UPSCABLE custom-config-string'),
                'utf-8'
            );
        });

        it('should validate required fields after merging', async () => {
            // Mock getCurrentConfig to return config without required fields
            vi.spyOn(service, 'getCurrentConfig').mockResolvedValue({});

            const config: UPSConfigInput = {
                upsType: UPSType.NET, // requires device
                // device not provided and not in existing config
            };

            await expect(service.configureUPS(config)).rejects.toThrow(
                'device is required for non-USB UPS types'
            );
        });

        it('should handle killpower configuration for enable + yes', async () => {
            const config: UPSConfigInput = {
                service: UPSServiceState.ENABLE,
                killUps: UPSKillPower.YES,
            };

            // Mock grep to return exit code 1 (not found)
            mockExeca.mockImplementation(((cmd: any, args: any) => {
                if (cmd === 'grep' && Array.isArray(args) && args.includes('apccontrol')) {
                    return Promise.resolve({ stdout: '', stderr: '', exitCode: 1 } as any);
                }
                return Promise.resolve({ stdout: '', stderr: '', exitCode: 0 } as any);
            }) as any);

            await service.configureUPS(config);

            // Should call sed to add killpower
            expect(mockExeca).toHaveBeenCalledWith('sed', [
                '-i',
                '-e',
                's:/sbin/poweroff:/etc/apcupsd/apccontrol killpower; /sbin/poweroff:',
                '/etc/rc.d/rc.6',
            ]);
        });

        it('should handle killpower configuration for disable case', async () => {
            const config: UPSConfigInput = {
                service: UPSServiceState.DISABLE,
                killUps: UPSKillPower.YES, // should be ignored since service is disabled
            };

            // Mock grep to return exit code 0 (found)
            mockExeca.mockImplementation(((cmd: any, args: any) => {
                if (cmd === 'grep' && Array.isArray(args) && args.includes('apccontrol')) {
                    return Promise.resolve({ stdout: '', stderr: '', exitCode: 0 } as any);
                }
                return Promise.resolve({ stdout: '', stderr: '', exitCode: 0 } as any);
            }) as any);

            await service.configureUPS(config);

            // Should call sed to remove killpower
            expect(mockExeca).toHaveBeenCalledWith('sed', [
                '-i',
                '-e',
                's:/etc/apcupsd/apccontrol killpower; /sbin/poweroff:/sbin/poweroff:',
                '/etc/rc.d/rc.6',
            ]);
        });

        it('should start service when enabled', async () => {
            const config: UPSConfigInput = {
                service: UPSServiceState.ENABLE,
            };

            await service.configureUPS(config);

            expect(mockExeca).toHaveBeenCalledWith('/etc/rc.d/rc.apcupsd', ['start'], {
                timeout: 10000,
            });
        });

        it('should not start service when disabled', async () => {
            const config: UPSConfigInput = {
                service: UPSServiceState.DISABLE,
            };

            await service.configureUPS(config);

            // Should not call start
            expect(mockExeca).not.toHaveBeenCalledWith(
                '/etc/rc.d/rc.apcupsd',
                ['start'],
                expect.any(Object)
            );
        });

        it('should preserve existing config values not provided in input', async () => {
            const config: UPSConfigInput = {
                batteryLevel: 50, // only update battery level
            };

            await service.configureUPS(config);

            // Find the config file write call (not the backup)
            const configWriteCall = mockWriteFile.mock.calls.find(
                (call) => call[0] === '/etc/apcupsd/apcupsd.conf' && call[1] !== 'backup content'
            );
            expect(configWriteCall).toBeDefined();

            const configContent = configWriteCall![1] as string;

            // Should preserve existing values in the generated format
            expect(configContent).toContain('UPSNAME MyUPS');
            expect(configContent).toContain('UPSCABLE usb');
            expect(configContent).toContain('UPSTYPE usb');
            expect(configContent).toContain('DEVICE /dev/ttyUSB0');
            expect(configContent).toContain('MINUTES 15'); // from existing config
            expect(configContent).toContain('TIMEOUT 30'); // from existing config
            expect(configContent).toContain('NETSERVER off');
            expect(configContent).toContain('NISIP 0.0.0.0');
            expect(configContent).toContain('MODELNAME "APC UPS"'); // Values with spaces get quoted

            // Should update provided value
            expect(configContent).toContain('BATTERYLEVEL 50');

            // Should preserve other values not in ordered list
            expect(configContent).toContain('SERVICE disable');
            expect(configContent).toContain('KILLUPS no');
        });

        it('should create backup before writing new config', async () => {
            const config: UPSConfigInput = {
                batteryLevel: 30,
            };

            mockReadFile.mockResolvedValueOnce('original config content');

            await service.configureUPS(config);

            // Should create backup
            expect(mockWriteFile).toHaveBeenCalledWith(
                '/etc/apcupsd/apcupsd.conf.backup',
                'original config content',
                'utf-8'
            );

            // Should write new config
            expect(mockWriteFile).toHaveBeenCalledWith(
                '/etc/apcupsd/apcupsd.conf',
                expect.any(String),
                'utf-8'
            );
        });

        it('should handle errors gracefully and restore backup', async () => {
            const config: UPSConfigInput = {
                batteryLevel: 30,
            };

            // Mock file operations
            mockReadFile
                .mockResolvedValueOnce('backup content') // for backup creation
                .mockResolvedValueOnce('backup content'); // for restore

            mockWriteFile
                .mockResolvedValueOnce(undefined) // succeed backup creation
                .mockRejectedValueOnce(new Error('Write failed')) // fail main config write
                .mockResolvedValueOnce(undefined); // succeed restore

            await expect(service.configureUPS(config)).rejects.toThrow(
                'Failed to configure UPS: Write failed'
            );

            // Should attempt to restore backup - check the final write call
            const writeCallArgs = mockWriteFile.mock.calls;
            const lastCall = writeCallArgs[writeCallArgs.length - 1];
            expect(lastCall[0]).toBe('/etc/apcupsd/apcupsd.conf');
            expect(lastCall[1]).toBe('backup content');
            expect(lastCall[2]).toBe('utf-8');
        });
    });
});
