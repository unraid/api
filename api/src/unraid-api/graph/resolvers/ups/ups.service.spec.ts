import { Test, TestingModule } from '@nestjs/testing';
import { mkdtemp, readFile, rm, unlink, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
vi.mock('@app/core/utils/files/file-exists.js');

const mockExeca = vi.mocked((await import('execa')).execa);
const mockFileExists = vi.mocked((await import('@app/core/utils/files/file-exists.js')).fileExists);

describe('UPSService', () => {
    let service: UPSService;
    let tempDir: string;
    let configPath: string;
    let backupPath: string;

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

    // Helper to create config file content
    const createConfigContent = (config: Record<string, any>): string => {
        const lines = ['# APC UPS Configuration File'];
        for (const [key, value] of Object.entries(config)) {
            if (value !== undefined) {
                lines.push(
                    `${key} ${typeof value === 'string' && value.includes(' ') ? `"${value}"` : value}`
                );
            }
        }
        return lines.join('\n') + '\n';
    };

    beforeEach(async () => {
        vi.clearAllMocks();

        // Create temporary directory for test files
        tempDir = await mkdtemp(join(tmpdir(), 'ups-test-'));
        configPath = join(tempDir, 'apcupsd.conf');
        backupPath = `${configPath}.backup`;

        const module: TestingModule = await Test.createTestingModule({
            providers: [UPSService],
        }).compile();

        service = module.get<UPSService>(UPSService);

        // Override the config path to use our temp directory
        Object.defineProperty(service, 'configPath', {
            value: configPath,
            writable: false,
            configurable: true,
        });

        // Mock logger methods on the service instance
        vi.spyOn(service['logger'], 'debug').mockImplementation(() => {});
        vi.spyOn(service['logger'], 'warn').mockImplementation(() => {});
        vi.spyOn(service['logger'], 'error').mockImplementation(() => {});

        // Default mocks
        mockFileExists.mockImplementation(async (path) => {
            if (path === configPath) {
                return true;
            }
            return false;
        });
        mockExeca.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 } as any);

        // Create initial config file
        await writeFile(configPath, createConfigContent(mockCurrentConfig));
    });

    afterEach(async () => {
        // Clean up temp directory
        await rm(tempDir, { recursive: true, force: true });
    });

    describe('configureUPS', () => {
        it('should merge partial config with existing values', async () => {
            const partialConfig: UPSConfigInput = {
                batteryLevel: 25,
                minutes: 10,
            };

            await service.configureUPS(partialConfig);

            // Read the written config file
            const writtenConfig = await readFile(configPath, 'utf-8');

            // Should preserve existing values for fields not provided
            expect(writtenConfig).toContain('SERVICE disable'); // preserved from existing
            expect(writtenConfig).toContain('UPSTYPE usb'); // preserved from existing
            expect(writtenConfig).toContain('BATTERYLEVEL 25'); // updated value
            expect(writtenConfig).toContain('MINUTES 10'); // updated value
            expect(writtenConfig).toContain('UPSNAME MyUPS'); // preserved
            expect(writtenConfig).toContain('DEVICE /dev/ttyUSB0'); // preserved
        });

        it('should use default values when neither input nor existing config provide values', async () => {
            // Write empty config file
            await writeFile(configPath, '# Empty config\n');

            const partialConfig: UPSConfigInput = {
                service: UPSServiceState.ENABLE,
            };

            await service.configureUPS(partialConfig);

            const writtenConfig = await readFile(configPath, 'utf-8');

            expect(writtenConfig).toContain('SERVICE enable'); // provided value
            expect(writtenConfig).toContain('UPSTYPE usb'); // default value
            expect(writtenConfig).toContain('BATTERYLEVEL 10'); // default value
            expect(writtenConfig).toContain('MINUTES 5'); // default value
        });

        it('should handle custom cable configuration', async () => {
            const config: UPSConfigInput = {
                upsCable: UPSCableType.CUSTOM,
                customUpsCable: 'custom-config-string',
            };

            await service.configureUPS(config);

            const writtenConfig = await readFile(configPath, 'utf-8');
            expect(writtenConfig).toContain('UPSCABLE custom-config-string');
        });

        it('should validate required fields after merging', async () => {
            // Write config without device field
            await writeFile(
                configPath,
                createConfigContent({
                    SERVICE: 'disable',
                    UPSTYPE: 'usb',
                })
            );

            const config: UPSConfigInput = {
                upsType: UPSType.NET, // requires device
                // device not provided and not in existing config
            };

            await expect(service.configureUPS(config)).rejects.toThrow(
                'device is required for non-USB UPS types'
            );
        });

        it('should handle killpower configuration for enable + yes', async () => {
            // Create a mock rc.6 file for this test
            const mockRc6Path = join(tempDir, 'mock-rc.6');
            await writeFile(mockRc6Path, '/sbin/poweroff', 'utf-8');
            service['rc6Path'] = mockRc6Path;

            // Update mock to indicate rc6 file exists
            mockFileExists.mockImplementation(async (path) => {
                if (path === configPath || path === mockRc6Path) {
                    return true;
                }
                return false;
            });

            const config: UPSConfigInput = {
                service: UPSServiceState.ENABLE,
                killUps: UPSKillPower.YES,
            };

            await service.configureUPS(config);

            // Should have modified the rc.6 file
            const rc6Content = await readFile(mockRc6Path, 'utf-8');
            expect(rc6Content).toContain('/etc/apcupsd/apccontrol killpower; /sbin/poweroff');

            expect(mockExeca).toHaveBeenCalledWith('/etc/rc.d/rc.apcupsd', ['start'], {
                timeout: 10000,
            });
        });

        it('should handle killpower configuration for disable case', async () => {
            // Create a mock rc.6 file with killpower already enabled
            const mockRc6Path = join(tempDir, 'mock-rc.6-2');
            await writeFile(mockRc6Path, '/etc/apcupsd/apccontrol killpower; /sbin/poweroff', 'utf-8');
            service['rc6Path'] = mockRc6Path;

            const config: UPSConfigInput = {
                service: UPSServiceState.DISABLE,
                killUps: UPSKillPower.YES, // should be ignored since service is disabled
            };

            await service.configureUPS(config);

            // Should NOT have modified the rc.6 file since service is disabled
            const rc6Content = await readFile(mockRc6Path, 'utf-8');
            expect(rc6Content).toContain('/etc/apcupsd/apccontrol killpower; /sbin/poweroff');
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

            const configContent = await readFile(configPath, 'utf-8');

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
            const originalContent = await readFile(configPath, 'utf-8');

            const config: UPSConfigInput = {
                batteryLevel: 30,
            };

            await service.configureUPS(config);

            // Should create backup with original content
            const backupContent = await readFile(backupPath, 'utf-8');
            expect(backupContent).toBe(originalContent);

            // Should write new config
            const newContent = await readFile(configPath, 'utf-8');
            expect(newContent).toContain('BATTERYLEVEL 30');
            expect(newContent).not.toBe(originalContent);
        });

        it('should handle errors gracefully and restore backup', async () => {
            const originalContent = await readFile(configPath, 'utf-8');

            const config: UPSConfigInput = {
                batteryLevel: 30,
            };

            // Temporarily override generateApcupsdConfig to throw error
            const originalGenerate = service['generateApcupsdConfig'].bind(service);
            service['generateApcupsdConfig'] = vi.fn().mockImplementation(() => {
                throw new Error('Generation failed');
            });

            // Since we can't easily mock fs operations with real files,
            // we'll test a different error path
            await expect(service.configureUPS(config)).rejects.toThrow(
                'Failed to configure UPS: Generation failed'
            );

            // Restore original method
            service['generateApcupsdConfig'] = originalGenerate;

            // Config should remain unchanged
            const currentContent = await readFile(configPath, 'utf-8');
            expect(currentContent).toBe(originalContent);
        });
    });

    describe('killpower functionality', () => {
        let tempRc6Path: string;

        beforeEach(async () => {
            // Create a temporary rc.6 file for testing
            tempRc6Path = join(tempDir, 'rc.6');

            // Create a mock rc.6 content
            const mockRc6Content = `#!/bin/sh
# Shutdown script
echo "Shutting down..."
/sbin/poweroff
exit 0
`;
            await writeFile(tempRc6Path, mockRc6Content, 'utf-8');

            // Override the rc6Path in the service (we'll need to make it configurable)
            service['rc6Path'] = tempRc6Path;

            // Update mock to indicate rc6 file exists
            mockFileExists.mockImplementation(async (path) => {
                if (path === configPath || path === tempRc6Path) {
                    return true;
                }
                return false;
            });
        });

        it('should enable killpower when killUps=yes and service=enable', async () => {
            const config: UPSConfigInput = {
                killUps: UPSKillPower.YES,
                service: UPSServiceState.ENABLE,
                upsType: UPSType.USB,
            };

            await service.configureUPS(config);

            const rc6Content = await readFile(tempRc6Path, 'utf-8');
            expect(rc6Content).toContain('/etc/apcupsd/apccontrol killpower; /sbin/poweroff');
            // The file still contains "exit 0" on a separate line
            expect(rc6Content).toContain('exit 0');
        });

        it('should disable killpower when killUps=no', async () => {
            // First enable killpower
            const enableConfig: UPSConfigInput = {
                killUps: UPSKillPower.YES,
                service: UPSServiceState.ENABLE,
                upsType: UPSType.USB,
            };
            await service.configureUPS(enableConfig);

            // Then disable it
            const disableConfig: UPSConfigInput = {
                killUps: UPSKillPower.NO,
                service: UPSServiceState.ENABLE,
                upsType: UPSType.USB,
            };
            await service.configureUPS(disableConfig);

            const rc6Content = await readFile(tempRc6Path, 'utf-8');
            expect(rc6Content).not.toContain('apccontrol killpower');
            expect(rc6Content).toContain('/sbin/poweroff\nexit 0'); // Should be restored
        });

        it('should not enable killpower when service=disable', async () => {
            const config: UPSConfigInput = {
                killUps: UPSKillPower.YES,
                service: UPSServiceState.DISABLE, // Service is disabled
                upsType: UPSType.USB,
            };

            await service.configureUPS(config);

            const rc6Content = await readFile(tempRc6Path, 'utf-8');
            expect(rc6Content).not.toContain('apccontrol killpower');
        });

        it('should handle missing rc.6 file gracefully', async () => {
            // Remove the file
            await unlink(tempRc6Path);

            // Update mock to indicate rc6 file does NOT exist
            mockFileExists.mockImplementation(async (path) => {
                if (path === configPath) {
                    return true;
                }
                return false;
            });

            const config: UPSConfigInput = {
                killUps: UPSKillPower.YES,
                service: UPSServiceState.ENABLE,
                upsType: UPSType.USB,
            };

            // Should not throw - just skip killpower configuration
            await expect(service.configureUPS(config)).resolves.not.toThrow();
        });

        it('should be idempotent - enabling killpower multiple times', async () => {
            const config: UPSConfigInput = {
                killUps: UPSKillPower.YES,
                service: UPSServiceState.ENABLE,
                upsType: UPSType.USB,
            };

            // Enable killpower twice
            await service.configureUPS(config);
            const firstContent = await readFile(tempRc6Path, 'utf-8');

            await service.configureUPS(config);
            const secondContent = await readFile(tempRc6Path, 'utf-8');

            // Content should be the same after second run
            expect(firstContent).toBe(secondContent);
            // Should only have one instance of killpower
            expect((secondContent.match(/apccontrol killpower/g) || []).length).toBe(1);
        });

        it('should be idempotent - disabling killpower multiple times', async () => {
            const config: UPSConfigInput = {
                killUps: UPSKillPower.NO,
                service: UPSServiceState.ENABLE,
                upsType: UPSType.USB,
            };

            // Disable killpower twice (when it's not enabled)
            await service.configureUPS(config);
            const firstContent = await readFile(tempRc6Path, 'utf-8');

            await service.configureUPS(config);
            const secondContent = await readFile(tempRc6Path, 'utf-8');

            // Content should be the same after second run
            expect(firstContent).toBe(secondContent);
            expect(secondContent).not.toContain('apccontrol killpower');
        });
    });
});
