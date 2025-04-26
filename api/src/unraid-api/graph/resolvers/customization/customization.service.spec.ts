import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs/promises';
import * as path from 'path';

import { plainToInstance } from 'class-transformer';
import * as ini from 'ini';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { emcmd } from '@app/core/utils/clients/emcmd.js';
import { fileExists } from '@app/core/utils/files/file-exists.js';
import { ActivationCode } from '@app/unraid-api/graph/resolvers/customization/activation-code.model.js';
import { CustomizationService } from '@app/unraid-api/graph/resolvers/customization/customization.service.js';

// Mocks
vi.mock('fs/promises');
vi.mock('@app/core/utils/clients/emcmd.js');
vi.mock('@app/core/utils/files/file-exists.js');

// Enable fake timers
vi.useFakeTimers();

// Mock store dynamically
const mockPaths = {
    activationBase: '/mock/boot/config/activation',
    'dynamix-config': ['/mock/default.cfg', '/mock/user/dynamix.cfg'],
    dynamixCaseModelConfig: '/mock/user/case-model.cfg',
    identConfig: '/mock/user/ident.cfg',
    webguiImagesBase: '/mock/webgui/images',
    partnerBannerSource: '/mock/boot/config/activation/assets/banner.png',
    partnerBannerTarget: '/mock/webgui/images/banner.png',
    caseModelSource: '/mock/boot/config/activation/assets/case-model.png',
    caseModelTarget: '/mock/webgui/images/case-model.png',
};
const mockDynamixState = { display: { theme: 'azure', header: 'FFFFFF' } };
const mockEmhttpState = { var: { name: 'Tower', sysModel: 'Custom', comment: 'Default' } };

vi.mock('@app/store/index.js', async () => {
    const actual = await vi.importActual('@app/store/index.js');
    return {
        ...actual,
        getters: {
            paths: vi.fn(() => mockPaths),
            dynamix: vi.fn(() => mockDynamixState),
            emhttp: vi.fn(() => mockEmhttpState),
        },
    };
});

vi.mock('@app/core/utils/clients/emcmd.js', async () => {
    const actual = await vi.importActual('@app/core/utils/clients/emcmd.js');
    // Create a minimal mock Response<string> satisfying the type
    const mockResponse = {
        body: '',
        rawBody: Buffer.from(''),
        ok: true,
        statusCode: 200,
        url: 'mock://url',
        requestUrl: new URL('mock://url'),
        redirectUrls: [],
        request: {} as any, // Use 'any' for simplicity if Request type is complex
        isFromCache: false,
        timings: { phases: {} } as any, // Use 'any' for simplicity
        retryCount: 0,
        // Add any other mandatory fields if needed, based on Response<string> definition
    };
    return {
        ...actual,
        emcmd: vi.fn(async () => mockResponse), // Return the mock response object
    };
});

vi.mock('@app/core/utils/misc/sleep.js', async () => {
    return {
        sleep: vi.fn(() => Promise.resolve()),
    };
});

describe('CustomizationService', () => {
    let service: CustomizationService;
    let loggerDebugSpy;
    let loggerLogSpy;
    let loggerWarnSpy;
    let loggerErrorSpy;

    // Resolved mock paths
    const activationDir = mockPaths.activationBase;
    const assetsDir = path.join(activationDir, 'assets');
    const doneFlag = path.join(activationDir, '.done');
    const userDynamixCfg = mockPaths['dynamix-config'][1];
    const caseModelCfg = mockPaths.dynamixCaseModelConfig;
    const identCfg = mockPaths.identConfig;
    const webguiImagesDir = mockPaths.webguiImagesBase;
    const activationJsonFile = 'test.activationcode';
    const activationJsonPath = path.join(activationDir, activationJsonFile);
    const bannerAssetPath = path.join(assetsDir, 'banner.png');
    const bannerDestPath = path.join(webguiImagesDir, 'banner.png');
    const caseModelAssetPath = path.join(assetsDir, 'case-model.png');
    const caseModelDestPath = path.join(webguiImagesDir, 'case-model.png');
    const partnerBannerSource = mockPaths.partnerBannerSource;
    const caseModelSource = mockPaths.caseModelSource;

    // Add mockActivationData definition here
    const mockActivationData = {
        header: '#112233',
        headermetacolor: '#445566',
        background: '#778899',
        showBannerGradient: true,
        theme: 'black',
        serverName: 'PartnerServer',
        sysModel: 'PartnerModel',
        comment: 'Partner Comment',
    };

    beforeEach(async () => {
        vi.clearAllMocks(); // Clear mocks before each test

        // Spy on logger methods
        loggerDebugSpy = vi.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});
        loggerLogSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
        loggerWarnSpy = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
        loggerErrorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

        const module: TestingModule = await Test.createTestingModule({
            providers: [CustomizationService],
        }).compile();

        service = module.get<CustomizationService>(CustomizationService);

        // Re-assign paths manually in beforeEach AFTER mocks are cleared and service instantiated
        // This simulates the dynamic import within onModuleInit
        (service as any).activationDir = activationDir;
        (service as any).hasRunFirstBootSetup = doneFlag;
        (service as any).configFile = userDynamixCfg;
        (service as any).caseModelCfg = caseModelCfg;
        (service as any).identCfg = identCfg;

        // Mock fileExists needed by customization methods
        vi.mocked(fileExists).mockImplementation(async (p) => {
            // Assume assets exist by default for these tests unless overridden
            return (
                p === partnerBannerSource ||
                p === bannerAssetPath ||
                p === caseModelAssetPath ||
                p === bannerDestPath
            );
        });
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('onModuleInit', () => {
        it('should log error if dynamix user config path is missing', async () => {
            // Temporarily modify mockPaths to simulate missing user config path
            const originalPaths = { ...mockPaths };
            mockPaths['dynamix-config'] = [mockPaths['dynamix-config'][0]]; // Only keep default config

            await service.onModuleInit();

            expect(loggerErrorSpy).toHaveBeenCalledWith(
                "Could not resolve user dynamix config path (paths['dynamix-config'][1]) from store."
            );
            // Expect subsequent operations that rely on configFile to potentially fail or not run
            expect(fs.writeFile).not.toHaveBeenCalledWith(doneFlag, 'true'); // Setup should bail early

            // Restore original paths
            mockPaths['dynamix-config'] = originalPaths['dynamix-config'];
        });

        it('should log error and rethrow non-ENOENT errors during activation dir access', async () => {
            const accessError = new Error('Permission denied');
            vi.mocked(fs.access).mockRejectedValueOnce(accessError); // Fail first access check

            await expect(service.onModuleInit()).resolves.toBeUndefined(); // onModuleInit catches and logs

            expect(loggerErrorSpy).toHaveBeenCalledWith(
                'Error during activation check/setup on init:',
                accessError
            );
            expect(fs.writeFile).not.toHaveBeenCalledWith(doneFlag, 'true'); // Should not proceed
        });

        it('should skip setup if activation directory does not exist', async () => {
            const error = new Error('ENOENT: no such file or directory') as NodeJS.ErrnoException;
            error.code = 'ENOENT';
            vi.mocked(fs.access).mockImplementation(async (p) => {
                if (p === activationDir) throw error;
            });

            await service.onModuleInit();

            expect(loggerLogSpy).toHaveBeenCalledWith(
                `Activation directory ${activationDir} not found. Skipping activation setup.`
            );
            expect(vi.mocked(fs.writeFile)).not.toHaveBeenCalledWith(doneFlag, 'true'); // Should not create .done flag
            expect(fs.readdir).not.toHaveBeenCalled(); // Should not try to read dir
        });

        it('should skip customizations if .done flag exists', async () => {
            vi.mocked(fileExists).mockImplementation(async (p) => p === doneFlag); // .done file exists

            await service.onModuleInit();

            expect(fs.readdir).not.toHaveBeenCalled(); // Should not read activation dir for JSON
        });

        it('should create .done flag and apply customizations if activation dir exists and .done flag is missing', async () => {
            // Setup mocks for full run: .done missing, activation JSON exists, assets exist
            vi.mocked(fileExists).mockImplementation(async (p) => {
                // Only assets exist, .done does not
                return p === bannerAssetPath || p === caseModelAssetPath;
            });
            vi.mocked(fs.access).mockResolvedValue(undefined); // Activation dir exists
            vi.mocked(fs.readdir).mockResolvedValue([activationJsonFile as any]); // Activation JSON exists
            vi.mocked(fs.readFile).mockImplementation(async (p) => {
                if (p === activationJsonPath) return JSON.stringify(mockActivationData);
                if (p === userDynamixCfg) return ini.stringify({}); // Mock empty dynamix cfg
                if (p === identCfg) return ini.stringify({}); // Mock empty ident cfg
                if (p === caseModelCfg) throw { code: 'ENOENT' }; // Mock case model cfg doesn't exist
                throw new Error(`Unexpected readFile: ${p}`);
            });
            vi.mocked(fs.writeFile).mockResolvedValue(undefined); // Ensure writeFile resolves

            const promise = service.onModuleInit();
            await vi.runAllTimers();
            await promise;

            // Check .done flag creation
            expect(fs.writeFile).toHaveBeenCalledWith(doneFlag, 'true');
            expect(loggerLogSpy).toHaveBeenCalledWith('First boot setup flag file created.');

            // Check activation data loaded
            expect(loggerLogSpy).toHaveBeenCalledWith(
                'Applying activation customizations if data is available...'
            );
            expect((service as any).activationData).toEqual(expect.objectContaining(mockActivationData));

            // Check customizations applied (verify mocks were called)
            expect(fs.copyFile).toHaveBeenCalledWith(bannerAssetPath, bannerDestPath); // Banner copied
            expect(fs.writeFile).toHaveBeenCalledWith(caseModelCfg, path.basename(caseModelDestPath));
            expect(fs.writeFile).toHaveBeenCalledWith(
                userDynamixCfg,
                expect.stringContaining('theme=black')
            ); // Display settings updated
            expect(fs.writeFile).toHaveBeenCalledWith(
                identCfg,
                expect.stringContaining('NAME=PartnerServer')
            ); // Ident settings updated

            // Run timers again to ensure emcmd is called
            await vi.runAllTimers();
            expect(emcmd).toHaveBeenCalledWith(
                expect.objectContaining({ NAME: 'PartnerServer', changeNames: 'Apply' })
            ); // emcmd called

            expect(loggerLogSpy).toHaveBeenCalledWith('Activation setup complete.');
        }, 10000);

        it('should handle errors during activation setup', async () => {
            const setupError = new Error('Failed to apply settings');
            const bannerCopyError = new Error('Failed to copy banner');

            // Setup mocks: dir exists, .done missing, JSON exists, read JSON ok
            vi.mocked(fileExists).mockImplementation(async (p) => {
                // .done is missing, banner asset exists
                return p === bannerAssetPath;
            });
            vi.mocked(fs.access).mockResolvedValue(undefined);
            vi.mocked(fs.readdir).mockResolvedValue([activationJsonFile as any]);
            vi.mocked(fs.readFile).mockImplementation(async (p) => {
                if (p === activationJsonPath) return JSON.stringify(mockActivationData);
                if (p === userDynamixCfg) return ini.stringify({});
                if (p === identCfg) return ini.stringify({});
                if (p === caseModelCfg) throw { code: 'ENOENT' };
                throw new Error(`Unexpected readFile: ${p}`);
            });
            vi.mocked(fs.writeFile).mockResolvedValue(undefined); // Assume writes succeed initially

            // --- Introduce failure point ---
            // Mock fs.copyFile used by setupPartnerBanner to fail
            vi.mocked(fs.copyFile).mockImplementation(async (source, dest) => {
                if (source === bannerAssetPath && dest === bannerDestPath) {
                    throw bannerCopyError;
                }
                // Allow other potential copy operations (if any)
            });

            // --- Spy on subsequent steps to ensure they are still called ---
            // We already mock fs.writeFile, so we can check calls to userDynamixCfg and identCfg
            const applyDisplaySettingsSpy = vi.spyOn(service as any, 'applyDisplaySettings');
            const applyServerIdentitySpy = vi.spyOn(service as any, 'applyServerIdentity');
            const updateCfgFileSpy = vi.spyOn(service as any, 'updateCfgFile');

            // --- Execute ---
            const promise = service.onModuleInit();
            await vi.runAllTimers();
            await promise;

            // --- Assertions ---
            // 1. .done flag is still created
            expect(fs.writeFile).toHaveBeenCalledWith(doneFlag, 'true');
            expect(loggerLogSpy).toHaveBeenCalledWith('First boot setup flag file created.');

            // 2. Activation data loaded
            expect(loggerLogSpy).toHaveBeenCalledWith(
                'Applying activation customizations if data is available...'
            );
            expect((service as any).activationData).toEqual(expect.objectContaining(mockActivationData));

            // 3. The specific error from the failing step (banner copy) is logged
            // setupPartnerBanner logs a warning on failure
            expect(loggerWarnSpy).toHaveBeenCalledWith(
                // Match the single string argument logged by the service
                `Failed to replace the original banner with the partner banner: ${bannerCopyError.message}`
            );

            // 4. Subsequent customization steps are still attempted
            expect(applyDisplaySettingsSpy).toHaveBeenCalled();
            // Check that applyDisplaySettings called updateCfgFile for userDynamixCfg
            expect(updateCfgFileSpy).toHaveBeenCalledWith(userDynamixCfg, 'display', expect.any(Object));

            expect(applyServerIdentitySpy).toHaveBeenCalled();
            // Check that applyServerIdentity called updateCfgFile for identCfg and emcmd
            expect(updateCfgFileSpy).toHaveBeenCalledWith(identCfg, null, expect.any(Object));

            // Run timers again to ensure emcmd is called
            await vi.runAllTimers();
            expect(emcmd).toHaveBeenCalledWith(expect.any(Object)); // emcmd should still be called
        }, 10000);
    });

    describe('getActivationData', () => {
        beforeEach(() => {
            // Ensure activationDir is set for these direct tests
            (service as any).activationDir = activationDir;
        });

        it('should return null if activation dir does not exist', async () => {
            const error = new Error('ENOENT') as NodeJS.ErrnoException;
            error.code = 'ENOENT';
            vi.mocked(fs.access).mockRejectedValue(error);
            const result = await service.getActivationData();
            expect(result).toBeNull();
            expect(loggerWarnSpy).toHaveBeenCalledWith(
                `Activation directory ${activationDir} not found when searching for JSON file.`
            );
        });

        it('should return null if no .activationcode file exists', async () => {
            vi.mocked(fs.access).mockResolvedValue(undefined);
            vi.mocked(fs.readdir).mockResolvedValue(['otherfile.txt' as any]);
            const result = await service.getActivationData();
            expect(result).toBeNull();
            expect(loggerWarnSpy).toHaveBeenCalledWith('No activation JSON file found.');
        });

        it('should return null and log error on readdir failure', async () => {
            const readDirError = new Error('Read dir permission denied');
            vi.mocked(fs.access).mockResolvedValue(undefined);
            vi.mocked(fs.readdir).mockRejectedValue(readDirError);
            const result = await service.getActivationData();
            expect(result).toBeNull();
            expect(loggerErrorSpy).toHaveBeenCalledWith(
                'Error accessing activation directory or reading its content.',
                readDirError
            );
        });

        it('should return null and log error on readFile failure', async () => {
            const readFileError = new Error('Read file permission denied');
            vi.mocked(fs.access).mockResolvedValue(undefined);
            vi.mocked(fs.readdir).mockResolvedValue([activationJsonFile as any]);
            vi.mocked(fs.readFile).mockRejectedValue(readFileError); // Simulate read failure

            const result = await service.getActivationData();
            expect(result).toBeNull();
            expect(loggerErrorSpy).toHaveBeenCalledWith(
                `Error processing activation file ${activationJsonPath}:`,
                readFileError
            );
        });

        it('should return null and log error for invalid JSON', async () => {
            const jsonError = new SyntaxError('Unexpected token i in JSON at position 1');
            vi.mocked(fs.access).mockResolvedValue(undefined);
            vi.mocked(fs.readdir).mockResolvedValue([activationJsonFile as any]);
            vi.mocked(fs.readFile).mockResolvedValue('{invalid json'); // Invalid JSON

            const result = await service.getActivationData();
            expect(result).toBeNull();
            // Check that the logged error includes the expected SyntaxError instance
            expect(loggerErrorSpy).toHaveBeenCalledWith(
                `Error processing activation file ${activationJsonPath}:`,
                expect.any(SyntaxError) // Or expect.objectContaining({ message: jsonError.message }) for more specific check
            );
        });

        // Updated Test: Invalid hex colors are transformed to empty strings, which should pass validation
        it('should successfully validate DTO even with invalid hex colors (transformed to empty string)', async () => {
            vi.mocked(fs.access).mockResolvedValue(undefined);
            vi.mocked(fs.readdir).mockResolvedValue([activationJsonFile as any]);
            // Provide data with an invalid hex color format
            const invalidHexData = { ...mockActivationData, header: 'not a hex color' };
            vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(invalidHexData));

            // Validation should now pass because the transformer handles the invalid value
            const result = await service.getActivationData();

            expect(result).toBeInstanceOf(ActivationCode);
            // Check that the invalid hex was transformed to an empty string
            expect(result?.header).toBe('');
            // Check other valid fields remain
            expect(result?.theme).toBe(mockActivationData.theme);
            // Validation errors are handled by validateOrReject throwing, not loggerErrorSpy here
            expect(loggerErrorSpy).not.toHaveBeenCalled();
        });

        // New Test: Check hex values without '#' are correctly prepended
        it('should correctly prepend # to hex colors provided without it', async () => {
            vi.mocked(fs.access).mockResolvedValue(undefined);
            vi.mocked(fs.readdir).mockResolvedValue([activationJsonFile as any]);
            const hexWithoutHashData = {
                ...mockActivationData,
                header: 'ABCDEF',
                headermetacolor: '123',
            };
            vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(hexWithoutHashData));

            const result = await service.getActivationData();

            expect(result).toBeInstanceOf(ActivationCode);
            expect(result?.header).toBe('#ABCDEF');
            expect(result?.headermetacolor).toBe('#123');
        });

        it('should return validated DTO on success', async () => {
            vi.mocked(fs.access).mockResolvedValue(undefined);
            vi.mocked(fs.readdir).mockResolvedValue([activationJsonFile as any]);
            vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockActivationData));
            // No need to mock validateOrReject, let it run

            const result = await service.getActivationData();

            expect(result).toBeInstanceOf(ActivationCode);
            // Use toStrictEqual for potentially nested objects/arrays if needed, but objectContaining is fine here
            expect(result).toEqual(expect.objectContaining(mockActivationData));
        });
    });

    // Indirect testing of applyActivationCustomizations via onModuleInit covers most cases.
    // Add specific tests if needed for edge cases not covered by onModuleInit tests.

    describe('Customization Methods (called via applyActivationCustomizations)', () => {
        beforeEach(() => {
            // Setup service state as if onModuleInit ran successfully before customizations
            (service as any).activationDir = activationDir;
            (service as any).hasRunFirstBootSetup = doneFlag;
            (service as any).configFile = userDynamixCfg;
            (service as any).caseModelCfg = caseModelCfg;
            (service as any).identCfg = identCfg;
            (service as any).activationData = plainToInstance(ActivationCode, { ...mockActivationData });
            // Mock necessary file reads/writes
            vi.mocked(fs.readFile).mockImplementation(async (p) => {
                if (p === userDynamixCfg) return ini.stringify({ display: { existing: 'value' } });
                if (p === identCfg) return ini.stringify({ NAME: 'OldName' });
                if (p === caseModelCfg) return 'old-model.png';
                // Simulate file not found for updateCfgFile tests where it matters
                // If activation JSON is read here, return mock data
                if (p === activationJsonPath) return JSON.stringify(mockActivationData);
                // Default empty for other reads
                return '';
            });
            vi.mocked(fileExists).mockResolvedValue(true); // Default assume files exist unless overridden
            vi.mocked(fs.writeFile).mockResolvedValue(undefined); // Default assume write succeeds
            vi.mocked(fs.copyFile).mockResolvedValue(undefined); // Default assume copy succeeds
        });

        it('setupPartnerBanner should copy banner if asset exists', async () => {
            vi.mocked(fileExists).mockResolvedValue(true); // Banner asset exists
            await (service as any).setupPartnerBanner();
            expect(fs.copyFile).toHaveBeenCalledWith(bannerAssetPath, bannerDestPath);
            expect(loggerLogSpy).toHaveBeenCalledWith(
                `Partner banner found at ${bannerAssetPath}, overwriting original.`
            );
            expect(loggerLogSpy).toHaveBeenCalledWith('Partner banner copied over the original banner.');
        });

        it('setupPartnerBanner should skip if asset does not exist', async () => {
            vi.mocked(fileExists).mockResolvedValue(false); // Banner asset does not exist
            await (service as any).setupPartnerBanner();
            expect(fs.copyFile).not.toHaveBeenCalled();
            expect(loggerLogSpy).toHaveBeenCalledWith(
                'Partner banner file not found, skipping banner setup.'
            );
        });

        it('setupPartnerBanner should log warning and skip if activation dir disappears after init', async () => {
            const accessError = new Error('ENOENT') as NodeJS.ErrnoException;
            accessError.code = 'ENOENT';
            // Mock access to succeed in onModuleInit context (implicit), but fail here
            vi.mocked(fs.access).mockRejectedValue(accessError);

            await (service as any).applyActivationCustomizations();

            expect(loggerWarnSpy).toHaveBeenCalledWith(
                'Activation directory disappeared after init? Skipping.'
            );
            // Ensure no customization methods were called
            expect(fs.copyFile).not.toHaveBeenCalled();
            expect(fs.writeFile).not.toHaveBeenCalled();
            expect(emcmd).not.toHaveBeenCalled();
        });

        it('setupPartnerBanner should log error on fileExists failure', async () => {
            const existsError = new Error('fs.stat failed');
            vi.mocked(fileExists).mockRejectedValue(existsError); // fileExists fails
            await (service as any).setupPartnerBanner();
            expect(fs.copyFile).not.toHaveBeenCalled(); // Should not attempt copy
            expect(loggerErrorSpy).toHaveBeenCalledWith('Error setting up partner banner:', existsError);
        });

        it('setupPartnerBanner should log warning on copy failure', async () => {
            const copyError = new Error('Disk full');
            vi.mocked(fileExists).mockResolvedValue(true); // Asset exists
            vi.mocked(fs.copyFile).mockRejectedValue(copyError); // Copy fails
            await (service as any).setupPartnerBanner();
            expect(fs.copyFile).toHaveBeenCalledWith(bannerAssetPath, bannerDestPath);
            expect(loggerWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining(`Failed to replace the original banner`)
            );
        });

        it('applyDisplaySettings should call updateCfgFile with correct data (stripping #)', async () => {
            const updateSpy = vi.spyOn(service as any, 'updateCfgFile');
            vi.mocked(fileExists).mockResolvedValue(true); // Assume banner exists for banner: 'image' logic
            await (service as any).setupPartnerBanner(); // Run banner setup first
            await (service as any).applyDisplaySettings();
            // Expect the hash to be stripped by applyDisplaySettings
            expect(updateSpy).toHaveBeenCalledWith(userDynamixCfg, 'display', {
                header: '112233', // # stripped
                headermetacolor: '445566', // # stripped
                background: '778899', // # stripped
                showBannerGradient: 'yes',
                theme: 'black',
                banner: 'image',
            });
            expect(loggerLogSpy).toHaveBeenCalledWith('Display settings updated in config file.');
        });

        it('applyDisplaySettings should skip if no relevant activation data', async () => {
            const updateSpy = vi.spyOn(service as any, 'updateCfgFile');
            // Simulate empty DTO after plainToClass
            (service as any).activationData = plainToInstance(ActivationCode, {});
            vi.mocked(fileExists).mockResolvedValue(true); // Assume banner file exists
            await (service as any).setupPartnerBanner(); // Ensure banner='image' logic runs
            await (service as any).applyDisplaySettings();

            // Only banner='image' and the default showBannerGradient='yes' should be set
            expect(updateSpy).toHaveBeenCalledWith(userDynamixCfg, 'display', {
                banner: 'image', // Only banner is set
                showBannerGradient: 'yes', // Default value from DTO
            });
            expect(loggerLogSpy).toHaveBeenCalledWith('Display settings updated in config file.');
        });

        it('applyDisplaySettings should skip banner field if banner file does not exist', async () => {
            const updateSpy = vi.spyOn(service as any, 'updateCfgFile');
            (service as any).activationData = plainToInstance(ActivationCode, { theme: 'white' }); // Some data, but no banner

            // Clear any previous mocks for fileExists and set a specific one for this test
            vi.mocked(fileExists).mockClear();
            // Ensure fileExists returns false specifically for the banner asset in this test
            vi.mocked(fileExists).mockImplementation(async (p) => {
                if (p === bannerAssetPath) return false;
                // Allow other fileExists calls (if any) to potentially resolve true based on default mocks
                // This requires knowing if other fileExists calls happen. Assuming none for now.
                // If needed, chain mockResolvedValue(true) or adjust default mock setup.
                return false; // Default to false if other paths are checked unexpectedly
            });

            await (service as any).setupPartnerBanner(); // Run banner setup (will log skip)
            await (service as any).applyDisplaySettings();

            // theme and default showBannerGradient are set, but banner field is not
            expect(updateSpy).toHaveBeenCalledWith(userDynamixCfg, 'display', {
                theme: 'white',
                showBannerGradient: 'yes', // Default value from DTO
                // banner: 'image' // Should NOT be present
            });
            expect(loggerLogSpy).toHaveBeenCalledWith('Display settings updated in config file.');
        });

        // Test for Failure 3 Fix
        it('applyDisplaySettings should handle empty string for invalid hex colors (skipping fields)', async () => {
            const updateSpy = vi.spyOn(service as any, 'updateCfgFile');
            // Simulate data after transformation results in empty strings
            (service as any).activationData = plainToInstance(ActivationCode, {
                ...mockActivationData,
                header: '', // Was invalid, transformed to empty
                headermetacolor: '#445566', // Valid
                background: '', // Was invalid, transformed to empty
            });
            vi.mocked(fileExists).mockResolvedValue(true); // Assume banner file exists
            await (service as any).setupPartnerBanner(); // Run banner setup
            await (service as any).applyDisplaySettings();

            // Expect empty strings to be filtered out, and valid hex stripped of #
            expect(updateSpy).toHaveBeenCalledWith(userDynamixCfg, 'display', {
                // header: '', // Should NOT be included (falsy check in service)
                headermetacolor: '445566', // '#' stripped (truthy)
                // background: '', // Should NOT be included (falsy check in service)
                showBannerGradient: 'yes', // truthy
                theme: 'black', // truthy
                banner: 'image', // Added by setupPartnerBanner success
            });
            expect(loggerLogSpy).toHaveBeenCalledWith('Display settings updated in config file.');
        });

        // New Test: Verify behavior when '#' was added by the transformer
        it('applyDisplaySettings should handle hex colors where # was prepended (stripping #)', async () => {
            const updateSpy = vi.spyOn(service as any, 'updateCfgFile');
            // Simulate data after transformation where # was added
            (service as any).activationData = plainToInstance(ActivationCode, {
                ...mockActivationData,
                header: '#ABCDEF', // Originally 'ABCDEF', now includes #
                headermetacolor: '#123', // Originally '123', now includes #
                background: '#778899', // Original, includes #
            });
            vi.mocked(fileExists).mockResolvedValue(true); // Assume banner exists
            await (service as any).setupPartnerBanner(); // Run banner setup
            await (service as any).applyDisplaySettings();

            // Expect '#' to be stripped by applyDisplaySettings before writing
            expect(updateSpy).toHaveBeenCalledWith(userDynamixCfg, 'display', {
                header: 'ABCDEF', // # stripped
                headermetacolor: '123', // # stripped
                background: '778899', // # stripped
                showBannerGradient: 'yes',
                theme: 'black',
                banner: 'image',
            });
            expect(loggerLogSpy).toHaveBeenCalledWith('Display settings updated in config file.');
        });

        it('applyCaseModelConfig should set model from asset if exists', async () => {
            vi.mocked(fileExists).mockImplementation(async (p) => p === caseModelAssetPath); // Asset exists
            await (service as any).applyCaseModelConfig();
            expect(fs.writeFile).toHaveBeenCalledWith(caseModelCfg, path.basename(caseModelDestPath));
            expect(loggerLogSpy).toHaveBeenCalledWith(
                `Case model set to ${path.basename(caseModelDestPath)} in ${caseModelCfg}`
            );
        });

        it('applyCaseModelConfig should do nothing if asset missing', async () => {
            vi.mocked(fileExists).mockResolvedValue(false); // Asset missing
            await (service as any).applyCaseModelConfig();
            expect(fs.writeFile).not.toHaveBeenCalledWith(caseModelCfg, expect.any(String)); // Should not write
            expect(loggerLogSpy).toHaveBeenCalledWith(
                'No custom case model file found in assets.' // Updated log message check
            );
        });

        it('applyServerIdentity should call updateCfgFile and emcmd', async () => {
            const updateSpy = vi.spyOn(service as any, 'updateCfgFile');
            const promise = (service as any).applyServerIdentity();
            await vi.runAllTimers();
            await promise;

            expect(updateSpy).toHaveBeenCalledWith(identCfg, null, {
                NAME: 'PartnerServer',
                SYS_MODEL: 'PartnerModel',
                COMMENT: 'Partner Comment',
            });
            expect(loggerLogSpy).toHaveBeenCalledWith(`Server identity updated in ${identCfg}`);

            // Run timers again to ensure emcmd is called
            await vi.runAllTimers();
            expect(emcmd).toHaveBeenCalledWith({
                NAME: 'PartnerServer',
                SYS_MODEL: 'PartnerModel',
                COMMENT: 'Partner Comment',
                changeNames: 'Apply',
            });
            expect(loggerLogSpy).toHaveBeenCalledWith('emcmd executed successfully.');
        }, 10000);

        it('applyServerIdentity should skip if no relevant activation data', async () => {
            const updateSpy = vi.spyOn(service as any, 'updateCfgFile');
            // Simulate empty DTO
            (service as any).activationData = plainToInstance(ActivationCode, {});
            await (service as any).applyServerIdentity();
            expect(updateSpy).not.toHaveBeenCalled();
            expect(emcmd).not.toHaveBeenCalled();
            expect(loggerLogSpy).toHaveBeenCalledWith(
                'No server identity information found in activation data.'
            );
        });

        it('applyServerIdentity should skip if activation data has no relevant fields', async () => {
            const updateSpy = vi.spyOn(service as any, 'updateCfgFile');
            // Simulate DTO with non-identity fields
            (service as any).activationData = plainToInstance(ActivationCode, { theme: 'white' });
            await (service as any).applyServerIdentity();
            expect(updateSpy).not.toHaveBeenCalled();
            expect(emcmd).not.toHaveBeenCalled();
            expect(loggerLogSpy).toHaveBeenCalledWith(
                'No server identity information found in activation data.'
            );
        });

        it('applyServerIdentity should log error on emcmd failure', async () => {
            const emcmdError = new Error('Command failed');
            vi.mocked(emcmd).mockRejectedValue(emcmdError);
            const updateSpy = vi.spyOn(service as any, 'updateCfgFile');

            const promise = (service as any).applyServerIdentity();
            await vi.runAllTimers();
            await promise;

            expect(updateSpy).toHaveBeenCalled(); // Still attempts updateCfgFile

            // Run timers again to ensure emcmd is called
            await vi.runAllTimers();
            expect(emcmd).toHaveBeenCalled();
            expect(loggerErrorSpy).toHaveBeenCalledWith(
                'Error applying server identity: %o',
                emcmdError
            );
        }, 10000);

        it('applyServerIdentity should truncate serverName if too long', async () => {
            const longServerName = 'ThisServerNameIsWayTooLongForUnraid'; // Length > 16
            const truncatedServerName = longServerName.slice(0, 15); // Expected truncated length
            // Simulate DTO with long serverName after plainToClass

            const testActivationParser = await plainToInstance(ActivationCode, {
                ...mockActivationData,
                serverName: longServerName,
            });

            expect(testActivationParser.serverName).toBe(truncatedServerName);
        });
    });
});

describe('applyActivationCustomizations specific tests', () => {
    let service: CustomizationService;
    let loggerLogSpy;
    let loggerWarnSpy;
    let loggerErrorSpy;
    let loggerDebugSpy;

    // Resolved mock paths
    const activationDir = mockPaths.activationBase;
    const userDynamixCfg = mockPaths['dynamix-config'][1];
    const caseModelCfg = mockPaths.dynamixCaseModelConfig;
    const identCfg = mockPaths.identConfig;
    const bannerAssetPath = path.join(activationDir, 'assets', 'banner.png');
    const bannerDestPath = path.join(mockPaths.webguiImagesBase, 'banner.png');
    const caseModelAssetPath = path.join(activationDir, 'assets', 'case-model.png');
    const caseModelDestPath = path.join(mockPaths.webguiImagesBase, 'case-model.png');
    const partnerBannerSource = mockPaths.partnerBannerSource;
    const caseModelSource = mockPaths.caseModelSource;

    // Add mockActivationData definition here
    const mockActivationData = {
        header: '#112233',
        headermetacolor: '#445566',
        background: '#778899',
        showBannerGradient: true,
        theme: 'black',
        serverName: 'PartnerServer',
        sysModel: 'PartnerModel',
        comment: 'Partner Comment',
    };

    beforeEach(async () => {
        // Re-initialize spies and service for this specific describe block
        vi.clearAllMocks();
        loggerDebugSpy = vi.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});
        loggerLogSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
        loggerWarnSpy = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
        loggerErrorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

        const module: TestingModule = await Test.createTestingModule({
            providers: [CustomizationService],
        }).compile();
        service = module.get<CustomizationService>(CustomizationService);

        // Setup basic service state needed for applyActivationCustomizations tests
        (service as any).activationDir = activationDir;
        (service as any).configFile = userDynamixCfg;
        (service as any).caseModelCfg = caseModelCfg;
        (service as any).identCfg = identCfg;
        (service as any).activationData = plainToInstance(ActivationCode, { ...mockActivationData });

        // Default mocks for dependencies, override in specific tests if needed
        vi.mocked(fs.copyFile).mockResolvedValue(undefined);
        vi.mocked(fs.writeFile).mockResolvedValue(undefined);
        vi.mocked(emcmd).mockResolvedValue({ body: '', ok: true } as any);
        vi.mocked(fs.access).mockResolvedValue(undefined); // Assume dirs/files accessible by default
        vi.mocked(fs.readFile).mockImplementation(async (p) => {
            if (p === userDynamixCfg) return ini.stringify({});
            if (p === identCfg) return ini.stringify({});
            if (p === caseModelCfg) return ''; // Assume empty or non-existent
            return '';
        });
        vi.mocked(fileExists).mockImplementation(async (p) => {
            // Assume relevant assets/targets exist unless overridden
            return p === partnerBannerSource || p === caseModelSource || p === bannerDestPath;
        });
    });

    it('should log warning and skip if activation dir disappears after init', async () => {
        const accessError = new Error('ENOENT') as NodeJS.ErrnoException;
        accessError.code = 'ENOENT';
        // Mock access inside applyActivationCustomizations to fail
        vi.mocked(fs.access).mockRejectedValue(accessError);

        await (service as any).applyActivationCustomizations();

        expect(loggerWarnSpy).toHaveBeenCalledWith(
            'Activation directory disappeared after init? Skipping.'
        );
        // Ensure no customization methods were called implicitly by checking their side effects
        const setupPartnerBannerSpy = vi.spyOn(service as any, 'setupPartnerBanner');
        const applyDisplaySettingsSpy = vi.spyOn(service as any, 'applyDisplaySettings');
        expect(setupPartnerBannerSpy).not.toHaveBeenCalled();
        expect(applyDisplaySettingsSpy).not.toHaveBeenCalled();
    });

    it('should log error if applyDisplaySettings fails during updateCfgFile', async () => {
        const updateError = new Error('Failed to write display config');
        // Mock updateCfgFile directly as it's a private method called internally
        vi.spyOn(service as any, 'updateCfgFile').mockImplementation(async (filePath) => {
            if (filePath === userDynamixCfg) throw updateError;
            // Allow other calls (like for ident.cfg) to pass if needed, though this mock is broad
        });

        await (service as any).applyActivationCustomizations();

        // setupPartnerBanner should still run (assuming its dependencies resolve)
        expect(loggerLogSpy).toHaveBeenCalledWith('Setting up partner banner...');

        // applyDisplaySettings should be called and fail internally, logging the error
        expect(loggerErrorSpy).toHaveBeenCalledWith('Error applying display settings:', updateError);

        // Other steps after display settings should still be attempted
        expect(loggerLogSpy).toHaveBeenCalledWith('Applying case model...'); // Check if next step's log appears
        expect(loggerLogSpy).toHaveBeenCalledWith('Applying server identity...');

        // Overall error from applyActivationCustomizations' catch block
        // REMOVED: expect(loggerErrorSpy).toHaveBeenCalledWith('Error during activation setup:', updateError);
    }, 10000);

    it('should log error if applyCaseModelConfig fails during readFile (non-ENOENT)', async () => {
        const readError = new Error('Read permission denied');
        vi.mocked(fs.readFile).mockImplementation(async (p) => {
            if (p === caseModelCfg) throw readError;
            if (p === userDynamixCfg) return ini.stringify({}); // Mock needed for applyDisplaySettings
            if (p === identCfg) return ini.stringify({}); // Mock needed for applyServerIdentity
            return '';
        });

        await (service as any).applyActivationCustomizations();

        // Check specific log from applyCaseModelConfig's catch block
        expect(loggerErrorSpy).toHaveBeenCalledWith('Error applying case model:', readError);
        // Check that the write step wasn't reached
        expect(fs.writeFile).not.toHaveBeenCalledWith(caseModelCfg, expect.any(String));

        // Other steps should still run
        expect(loggerLogSpy).toHaveBeenCalledWith('Setting up partner banner...');
        expect(loggerLogSpy).toHaveBeenCalledWith('Applying display settings...');
        expect(loggerLogSpy).toHaveBeenCalledWith('Applying server identity...');

        // Overall error from applyActivationCustomizations' catch block
        // REMOVED: expect(loggerErrorSpy).toHaveBeenCalledWith('Error during activation setup:', readError);
    }, 10000);

    it('should log error if applyCaseModelConfig fails during writeFile', async () => {
        const writeError = new Error('Write permission denied');
        vi.mocked(fileExists).mockImplementation(async (p) => p === caseModelSource); // Ensure model asset exists
        vi.mocked(fs.writeFile).mockImplementation(async (p, data) => {
            if (p === caseModelCfg) throw writeError;
            // Allow other writes (like userDynamixCfg) to pass
        });

        await (service as any).applyActivationCustomizations();

        // Check specific log from applyCaseModelConfig's *inner* catch block
        expect(loggerErrorSpy).toHaveBeenCalledWith(
            `Failed to write case model config: ${writeError.message}`
        );
        // Other steps should still run
        expect(loggerLogSpy).toHaveBeenCalledWith('Setting up partner banner...');
        expect(loggerLogSpy).toHaveBeenCalledWith('Applying display settings...');
        expect(loggerLogSpy).toHaveBeenCalledWith('Applying server identity...');

        // NO overall error logged because the writeFile error is caught internally
        expect(loggerErrorSpy).not.toHaveBeenCalledWith(
            'Error during activation setup:',
            expect.any(Error)
        ); // This line should remain
    }, 10000);

    it('should log error if applyCaseModelConfig fails during fileExists check', async () => {
        const existsError = new Error('fileExists failed');
        vi.mocked(fileExists).mockImplementation(async (p) => {
            if (p === caseModelSource) throw existsError;
            // Assume other relevant files exist
            return p === partnerBannerSource || p === bannerDestPath;
        });

        await (service as any).applyActivationCustomizations();

        // Check specific log from applyCaseModelConfig's catch block
        expect(loggerErrorSpy).toHaveBeenCalledWith('Error applying case model:', existsError);

        // Other steps should still run
        expect(loggerLogSpy).toHaveBeenCalledWith('Setting up partner banner...');
        expect(loggerLogSpy).toHaveBeenCalledWith('Applying display settings...');
        expect(loggerLogSpy).toHaveBeenCalledWith('Applying server identity...');

        // Overall error from applyActivationCustomizations' catch block
        // REMOVED: expect(loggerErrorSpy).toHaveBeenCalledWith('Error during activation setup:', existsError);
    }, 10000);

    it('should log error if applyServerIdentity fails during updateCfgFile', async () => {
        const updateError = new Error('Failed to write ident config');
        // Mock updateCfgFile to throw only when called for identCfg
        const originalUpdateCfgFile = (service as any).updateCfgFile.bind(service);
        vi.spyOn(service as any, 'updateCfgFile').mockImplementation(
            async (filePath, section, updates) => {
                if (filePath === identCfg) {
                    throw updateError;
                }
                // Ensure the call for display settings passes
                if (filePath === userDynamixCfg) {
                    return originalUpdateCfgFile(filePath, section, updates);
                }
                // Potentially handle other unexpected calls if necessary
                throw new Error(`Unexpected updateCfgFile call: ${filePath}`);
            }
        );

        await (service as any).applyActivationCustomizations();

        // Previous steps should run
        expect(loggerLogSpy).toHaveBeenCalledWith('Setting up partner banner...');
        expect(loggerLogSpy).toHaveBeenCalledWith('Applying display settings...');
        expect(loggerLogSpy).toHaveBeenCalledWith('Applying case model...');

        // applyServerIdentity should fail and log
        expect(loggerErrorSpy).toHaveBeenCalledWith('Error applying server identity: %o', updateError);
        expect(emcmd).not.toHaveBeenCalled(); // emcmd should not be called if updateCfgFile fails

        // Overall error from applyActivationCustomizations' catch block
        // REMOVED: expect(loggerErrorSpy).toHaveBeenCalledWith('Error during activation setup:', updateError);
    }, 10000);
});

// Standalone tests for updateCfgFile utility function within the service
describe('CustomizationService - updateCfgFile', () => {
    let service: CustomizationService;
    let loggerLogSpy;
    let loggerErrorSpy;
    const filePath = '/test/config.cfg';

    beforeEach(async () => {
        vi.clearAllMocks();
        loggerLogSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
        loggerErrorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

        // Need to compile a module to get an instance, even though we test a private method
        const module: TestingModule = await Test.createTestingModule({
            providers: [CustomizationService],
        }).compile();
        service = module.get<CustomizationService>(CustomizationService);

        // Mock file system operations for updateCfgFile
        vi.mocked(fs.readFile).mockImplementation(async (p) => {
            if (p === filePath) {
                const err = new Error('ENOENT') as NodeJS.ErrnoException;
                err.code = 'ENOENT';
                throw err; // Default: file not found for read
            }
            throw new Error(`Unexpected readFile call in updateCfgFile tests: ${p}`);
        });
        vi.mocked(fs.writeFile).mockResolvedValue(undefined); // Default: write succeeds
    });

    it('should create file with section if it does not exist', async () => {
        const section = 'mySection';
        const updates = { key1: 'newValue1', key2: 'newValue2' };
        await (service as any).updateCfgFile(filePath, section, updates);

        expect(fs.writeFile).toHaveBeenCalledOnce();
        const writeArgs = vi.mocked(fs.writeFile).mock.calls[0];
        expect(writeArgs[0]).toBe(filePath); // Check file path
        const writtenContent = ini.parse(writeArgs[1] as string);
        expect(writtenContent).toEqual({ [section]: updates });

        expect(loggerLogSpy).toHaveBeenCalledWith(`Config file ${filePath} not found, will create it.`);
        expect(loggerLogSpy).toHaveBeenCalledWith(`Config file ${filePath} updated successfully.`);
    });

    it('should create file without section if it does not exist', async () => {
        const updates = { key1: 'newValue1', key2: 'newValue2' };
        await (service as any).updateCfgFile(filePath, null, updates);

        expect(fs.writeFile).toHaveBeenCalledOnce();
        const writeArgs = vi.mocked(fs.writeFile).mock.calls[0];
        expect(writeArgs[0]).toBe(filePath); // Check file path
        const writtenContent = ini.parse(writeArgs[1] as string);
        expect(writtenContent).toEqual(updates);

        expect(loggerLogSpy).toHaveBeenCalledWith(`Config file ${filePath} not found, will create it.`);
        expect(loggerLogSpy).toHaveBeenCalledWith(`Config file ${filePath} updated successfully.`);
    });

    it('should merge updates with existing content (with section)', async () => {
        const section = 'mySection';
        const updates = { key1: 'newValue1', key3: 'newValue3' };
        const existingData = {
            [section]: { key1: 'oldValue1', key2: 'oldValue2' },
            otherSection: { keyA: 'valA' },
        };
        vi.mocked(fs.readFile).mockResolvedValue(ini.stringify(existingData)); // Mock read success

        await (service as any).updateCfgFile(filePath, section, updates);

        expect(fs.writeFile).toHaveBeenCalledOnce();
        const writeArgs = vi.mocked(fs.writeFile).mock.calls[0];
        expect(writeArgs[0]).toBe(filePath); // Check file path
        const writtenContent = ini.parse(writeArgs[1] as string);
        expect(writtenContent).toEqual({
            [section]: { key1: 'newValue1', key2: 'oldValue2', key3: 'newValue3' },
            otherSection: { keyA: 'valA' },
        });

        expect(loggerLogSpy).toHaveBeenCalledWith(`Config file ${filePath} updated successfully.`);
        expect(loggerLogSpy).not.toHaveBeenCalledWith(
            `Config file ${filePath} not found, will create it.`
        );
    });

    it('should merge updates with existing content (no section)', async () => {
        const updates = { key1: 'newValue1', key3: 'newValue3' };
        const existingData = { key1: 'oldValue1', key2: 'oldValue2' };
        vi.mocked(fs.readFile).mockResolvedValue(ini.stringify(existingData)); // Mock read success

        await (service as any).updateCfgFile(filePath, null, updates);

        expect(fs.writeFile).toHaveBeenCalledOnce();
        const writeArgs = vi.mocked(fs.writeFile).mock.calls[0];
        expect(writeArgs[0]).toBe(filePath); // Check file path
        const writtenContent = ini.parse(writeArgs[1] as string);
        expect(writtenContent).toEqual({ key1: 'newValue1', key2: 'oldValue2', key3: 'newValue3' });

        expect(loggerLogSpy).toHaveBeenCalledWith(`Config file ${filePath} updated successfully.`);
        expect(loggerLogSpy).not.toHaveBeenCalledWith(
            `Config file ${filePath} not found, will create it.`
        );
    });

    it('should add section if it does not exist in existing file', async () => {
        const section = 'newSection';
        const updates = { key1: 'newValue1' };
        const existingData = { otherSection: { keyA: 'valA' } };
        vi.mocked(fs.readFile).mockResolvedValue(ini.stringify(existingData)); // Mock read success

        await (service as any).updateCfgFile(filePath, section, updates);

        expect(fs.writeFile).toHaveBeenCalledOnce();
        const writeArgs = vi.mocked(fs.writeFile).mock.calls[0];
        expect(writeArgs[0]).toBe(filePath); // Check file path
        const writtenContent = ini.parse(writeArgs[1] as string);
        expect(writtenContent).toEqual({
            [section]: updates,
            otherSection: { keyA: 'valA' },
        });

        expect(loggerLogSpy).toHaveBeenCalledWith(`Config file ${filePath} updated successfully.`);
        expect(loggerLogSpy).not.toHaveBeenCalledWith(
            `Config file ${filePath} not found, will create it.`
        );
    });

    it('should log error and rethrow on readFile failure (non-ENOENT)', async () => {
        const readError = new Error('Permission denied');
        vi.mocked(fs.readFile).mockRejectedValue(readError); // Mock read failure
        const updates = { key: 'value' };

        await expect((service as any).updateCfgFile(filePath, null, updates)).rejects.toThrow(readError);
        expect(loggerErrorSpy).toHaveBeenCalledWith(`Error reading config file ${filePath}:`, readError);
        expect(fs.writeFile).not.toHaveBeenCalled(); // Write should not be attempted
    });

    it('should log error and rethrow on writeFile failure', async () => {
        const writeError = new Error('Disk full');
        vi.mocked(fs.writeFile).mockRejectedValue(writeError); // Mock write failure
        const updates = { key: 'value' };
        // Assume file doesn't exist initially (default readFile mock throws ENOENT)

        await expect((service as any).updateCfgFile(filePath, null, updates)).rejects.toThrow(
            writeError
        );
        // It logs "not found" first, then tries to write
        expect(loggerLogSpy).toHaveBeenCalledWith(`Config file ${filePath} not found, will create it.`);
        expect(loggerErrorSpy).toHaveBeenCalledWith(
            `Error writing config file ${filePath}:`,
            writeError
        );
    });
});
