import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs/promises';
import * as path from 'path';

import type { Mock } from 'vitest';
import { plainToInstance } from 'class-transformer';
import * as ini from 'ini';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { emcmd } from '@app/core/utils/clients/emcmd.js';
import { fileExists } from '@app/core/utils/files/file-exists.js';
import { getters } from '@app/store/index.js';
import { OnboardingOverrideService } from '@app/unraid-api/config/onboarding-override.service.js';
import { OnboardingStateService } from '@app/unraid-api/config/onboarding-state.service.js';
import { OnboardingTrackerService } from '@app/unraid-api/config/onboarding-tracker.module.js';
import { ActivationCode } from '@app/unraid-api/graph/resolvers/customization/activation-code.model.js';
import { OnboardingService } from '@app/unraid-api/graph/resolvers/customization/onboarding.service.js';

vi.mock('@app/core/utils/files/file-exists.js');
vi.mock('fs/promises', async () => {
    const actual = await vi.importActual<typeof import('fs/promises')>('fs/promises');
    return {
        ...actual,
        mkdir: vi.fn(),
        access: vi.fn(),
        readdir: vi.fn(),
        readFile: vi.fn(),
        writeFile: vi.fn(),
        copyFile: vi.fn(),
        rename: vi.fn(),
        unlink: vi.fn(),
        symlink: vi.fn(),
    };
});

const mockPaths = {
    activationBase: '/mock/boot/config/activation',
    'dynamix-config': ['/mock/default.cfg', '/mock/user/dynamix.cfg'],
    identConfig: '/mock/user/ident.cfg',
    webguiImagesBase: '/mock/webgui/images',
    activation: {
        assets: '/mock/boot/config/activation/assets',
        logo: '/mock/boot/config/activation/assets/logo.svg',
        caseModel: '/mock/boot/config/activation/assets/case-model.png',
        banner: '/mock/boot/config/activation/assets/banner.png',
    },
    boot: {
        caseModel: '/mock/boot/config/plugins/dynamix/case-model.png',
        caseModelConfig: '/mock/boot/config/plugins/dynamix/case-model.cfg',
    },
    webgui: {
        logo: {
            fullPath: '/mock/webgui/images/UN-logotype-gradient.svg',
            assetPath: '/UN-logotype-gradient.svg',
        },
        caseModel: {
            fullPath: '/mock/webgui/images/case-model.png',
            assetPath: '/case-model.png',
        },
        banner: {
            fullPath: '/mock/webgui/images/banner.png',
            assetPath: '/banner.png',
        },
    },
};
vi.mock('@app/store/index.js', async () => {
    const actual = await vi.importActual('@app/store/index.js');
    return {
        ...actual,
        getters: {
            paths: vi.fn(() => mockPaths),
            dynamix: vi.fn(() => ({
                display: { theme: 'azure', header: 'FFFFFF', terminalButton: 'yes' },
            })),
            emhttp: vi.fn(() => ({ var: { name: 'Tower', sysModel: 'Custom', comment: 'Default' } })),
        },
        store: {
            getState: vi.fn(() => ({
                paths: mockPaths,
                dynamix: { display: { theme: 'azure', header: 'FFFFFF', terminalButton: 'yes' } },
                emhttp: { var: { name: 'Tower', sysModel: 'Custom', comment: 'Default' } },
            })),
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

const onboardingTrackerMock = {
    isCompleted: vi.fn<() => boolean>(),
    getState: vi.fn<() => { completed: boolean; completedAtVersion?: string }>(),
    markCompleted: vi.fn<() => Promise<{ completed: boolean; completedAtVersion?: string }>>(),
};
const onboardingOverridesMock = {
    getState: vi.fn(),
    setState: vi.fn(),
    clearState: vi.fn(),
};
const onboardingStateMock = {
    getRegistrationState: vi.fn(),
    hasActivationCode: vi.fn(),
    isFreshInstall: vi.fn(),
    requiresActivationStep: vi.fn(),
    isRegistered: vi.fn(),
};

describe('OnboardingService', () => {
    let service: OnboardingService;
    let loggerDebugSpy;
    let loggerLogSpy;
    let loggerWarnSpy;
    let loggerErrorSpy;

    // Resolved mock paths
    const activationDir = mockPaths.activationBase;
    const assetsDir = mockPaths.activation.assets;
    const userDynamixCfg = mockPaths['dynamix-config'][1];
    const identCfg = mockPaths.identConfig;
    const webguiImagesDir = mockPaths.webguiImagesBase;
    const activationJsonFile = 'test.activationcode';
    const activationJsonPath = path.join(activationDir, activationJsonFile);
    const bannerSource = mockPaths.activation.banner;
    const bannerTarget = mockPaths.webgui.banner;
    const caseModelSource = mockPaths.activation.caseModel;
    const caseModelTarget = mockPaths.webgui.caseModel;
    const caseModelCfg = mockPaths.boot.caseModelConfig;

    // Add mockActivationData definition here
    const mockActivationData = {
        branding: {
            header: '#112233',
            headermetacolor: '#445566',
            background: '#778899',
            showBannerGradient: true,
            theme: 'black',
            bannerImage: './assets/banner.png',
            caseModelImage: './assets/case-model.png',
            partnerLogoLightUrl: './assets/partner-logo-light.png',
            partnerLogoDarkUrl: './assets/partner-logo-dark.png',
        },
        system: {
            serverName: 'PartnerServer',
            model: 'PartnerModel',
            comment: 'Partner Comment',
        },
    };

    beforeEach(async () => {
        vi.clearAllMocks(); // Clear mocks before each test
        vi.useFakeTimers();
        // Spy on logger methods
        loggerDebugSpy = vi.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});
        loggerLogSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
        loggerWarnSpy = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
        loggerErrorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
        onboardingTrackerMock.isCompleted.mockReset();
        onboardingTrackerMock.isCompleted.mockReturnValue(false);
        onboardingOverridesMock.getState.mockReset();
        onboardingOverridesMock.getState.mockReturnValue(null);
        onboardingOverridesMock.setState.mockReset();
        onboardingOverridesMock.clearState.mockReset();
        onboardingStateMock.getRegistrationState.mockReset();
        onboardingStateMock.getRegistrationState.mockReturnValue(undefined);
        onboardingStateMock.hasActivationCode.mockReset();
        onboardingStateMock.hasActivationCode.mockResolvedValue(false);
        onboardingStateMock.isFreshInstall.mockReset();
        onboardingStateMock.isFreshInstall.mockReturnValue(false);
        onboardingStateMock.requiresActivationStep.mockReset();
        onboardingStateMock.requiresActivationStep.mockReturnValue(false);
        onboardingStateMock.isRegistered.mockReset();
        onboardingStateMock.isRegistered.mockReturnValue(false);
        vi.mocked(fs.mkdir).mockResolvedValue(undefined as any);
        vi.mocked(fs.access).mockReset();
        vi.mocked(fs.readdir).mockReset();
        vi.mocked(fs.readFile).mockReset();
        vi.mocked(fs.writeFile).mockReset();
        vi.mocked(fs.copyFile).mockReset();
        vi.mocked(fs.rename).mockReset();
        vi.mocked(fs.unlink).mockReset();
        vi.mocked(fs.symlink).mockReset();
        vi.mocked(fileExists).mockReset();
        vi.mocked(fs.access).mockResolvedValue(undefined as any);
        vi.mocked(fs.readdir).mockResolvedValue([]);
        vi.mocked(fs.readFile).mockResolvedValue('');
        vi.mocked(fs.writeFile).mockResolvedValue(undefined as any);
        vi.mocked(fs.copyFile).mockResolvedValue(undefined as any);
        vi.mocked(fs.rename).mockResolvedValue(undefined as any);
        vi.mocked(fs.unlink).mockResolvedValue(undefined as any);
        vi.mocked(fs.symlink).mockRejectedValue(new Error('symlink not supported'));
        vi.mocked(fileExists).mockResolvedValue(false);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OnboardingService,
                { provide: OnboardingTrackerService, useValue: onboardingTrackerMock },
                { provide: OnboardingOverrideService, useValue: onboardingOverridesMock },
                { provide: OnboardingStateService, useValue: onboardingStateMock },
            ],
        }).compile();

        service = module.get<OnboardingService>(OnboardingService);

        // Mock fileExists needed by customization methods
        vi.mocked(fileExists).mockImplementation(async (p) => {
            // Assume relevant assets/targets exist unless overridden
            return p === bannerSource || p === caseModelSource || p === bannerTarget.fullPath;
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        mockPaths['dynamix-config'] = ['/mock/default.cfg', '/mock/user/dynamix.cfg'];
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('onModuleInit', () => {
        it('should log error if dynamix user config path is missing', async () => {
            const originalDynamixConfig = [...mockPaths['dynamix-config']];
            mockPaths['dynamix-config'] = [originalDynamixConfig[0]];

            await service.onModuleInit();

            expect(loggerErrorSpy).toHaveBeenCalledWith(
                'User dynamix config path missing. Skipping activation setup.'
            );
            expect(onboardingTrackerMock.isCompleted).not.toHaveBeenCalled();

            mockPaths['dynamix-config'] = originalDynamixConfig;
        });

        it('should log error and rethrow non-ENOENT errors during activation dir access', async () => {
            const accessError = new Error('Permission denied');
            vi.mocked(fs.access).mockRejectedValueOnce(accessError); // Fail first access check

            await expect(service.onModuleInit()).resolves.toBeUndefined(); // onModuleInit catches and logs

            expect(loggerErrorSpy).toHaveBeenCalledWith(
                'Error during activation check/setup on init:',
                accessError
            );
        });

        it('should skip setup if activation directory does not exist', async () => {
            const error = new Error('ENOENT: no such file or directory') as NodeJS.ErrnoException;
            error.code = 'ENOENT';
            vi.mocked(fs.access).mockImplementation(async (p) => {
                if (p === activationDir || p === activationDir.replace('/activation', '/activate')) {
                    throw error;
                }
            });

            await service.onModuleInit();

            expect(loggerLogSpy).toHaveBeenCalledWith(
                `Activation directory ${activationDir} not found. Skipping activation setup.`
            );
            expect(fs.readdir).not.toHaveBeenCalled(); // Should not try to read dir
        });

        it('should skip customizations when first boot already completed', async () => {
            onboardingTrackerMock.isCompleted.mockReturnValueOnce(true);

            await service.onModuleInit();

            expect(onboardingTrackerMock.isCompleted).toHaveBeenCalledTimes(1);
            expect(fs.readdir).not.toHaveBeenCalled();
            expect(loggerLogSpy).toHaveBeenCalledWith(
                'Onboarding already completed, skipping first boot setup.'
            );
            expect(loggerLogSpy).toHaveBeenCalledWith(
                'First boot setup previously completed, skipping customizations.'
            );
        });

        it('should be idempotent across init calls when tracker marks setup complete', async () => {
            onboardingTrackerMock.isCompleted
                .mockReturnValueOnce(false) // first init applies customizations
                .mockReturnValueOnce(true); // second init should skip
            vi.mocked(fs.access).mockResolvedValue(undefined);
            vi.mocked(fs.readdir).mockResolvedValue([activationJsonFile as any]);
            vi.mocked(fs.readFile).mockImplementation(async (p) => {
                if (p === activationJsonPath) return JSON.stringify(mockActivationData);
                if (p === userDynamixCfg) return ini.stringify({});
                if (p === identCfg) return ini.stringify({});
                if (p === caseModelCfg) throw { code: 'ENOENT' };
                throw new Error(`Unexpected readFile: ${p}`);
            });

            await service.onModuleInit();
            await service.onModuleInit();

            expect(onboardingTrackerMock.isCompleted).toHaveBeenCalledTimes(2);
            expect(fs.readdir).toHaveBeenCalledTimes(1);
            expect(fs.copyFile).toHaveBeenCalledTimes(2);
            expect(emcmd).not.toHaveBeenCalled();
            expect(loggerLogSpy).toHaveBeenCalledWith(
                'First boot setup previously completed, skipping customizations.'
            );
        });

        it('should create flag and apply customizations if activation dir exists and flag is missing', async () => {
            // Setup mocks for full run: .done missing, activation JSON exists, assets exist
            vi.mocked(fileExists).mockImplementation(async (p) => {
                // Only assets exist, .done does not
                return p === bannerSource || p === caseModelSource;
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
            expect(onboardingTrackerMock.isCompleted).toHaveBeenCalledTimes(1);
            expect(loggerLogSpy).toHaveBeenCalledWith('First boot setup in progress.');

            // Check activation data loaded
            expect(loggerLogSpy).toHaveBeenCalledWith(
                'Applying activation customizations if data is available...'
            );
            expect((service as any).activationData).toEqual(expect.objectContaining(mockActivationData));

            // Check customizations applied (verify mocks were called)
            expect(fs.copyFile).toHaveBeenCalledWith(
                bannerSource,
                expect.stringContaining(`${bannerTarget.fullPath}.tmp-`)
            ); // Banner staged copy

            // Verify we write to dynamix config without forcing activation branding theme
            const writeFileCalls = vi.mocked(fs.writeFile).mock.calls;
            const dynamixCfgCall = writeFileCalls.find((call) => call[0] === userDynamixCfg);
            expect(dynamixCfgCall).toBeDefined();
            expect(dynamixCfgCall?.[1]).toContain('theme="azure"');

            expect(loggerLogSpy).toHaveBeenCalledWith('Activation setup complete.');
        }, 10000);

        it('should handle errors during activation setup', async () => {
            const setupError = new Error('Failed to apply settings');
            const bannerCopyError = new Error('Failed to copy banner');

            // Setup mocks: dir exists, .done missing, JSON exists, read JSON ok
            vi.mocked(fileExists).mockImplementation(async (p) => {
                // .done is missing, all json-declared assets exist
                return p === bannerSource || p === caseModelSource;
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
                if (
                    source === bannerSource &&
                    typeof dest === 'string' &&
                    dest.startsWith(`${bannerTarget.fullPath}.tmp-`)
                ) {
                    throw bannerCopyError;
                }
                // Allow other potential copy operations (if any)
            });

            // --- Spy on subsequent steps to ensure they are still called ---
            // We already mock fs.writeFile, so we can check calls to userDynamixCfg and identCfg
            const applyDisplaySettingsSpy = vi.spyOn(service as any, 'applyDisplaySettings');
            const updateCfgFileSpy = vi.spyOn(service as any, 'updateCfgFile');

            // --- Execute ---
            const promise = service.onModuleInit();
            await vi.runAllTimers();
            await promise;

            // --- Assertions ---
            // 1. First boot completion is recorded
            expect(onboardingTrackerMock.isCompleted).toHaveBeenCalledTimes(1);
            expect(loggerLogSpy).toHaveBeenCalledWith('First boot setup in progress.');

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
            expect(updateCfgFileSpy).toHaveBeenCalledWith(
                userDynamixCfg, // The first parameter is the userDynamixCfg path
                'display',
                expect.any(Object)
            );

            expect(emcmd).not.toHaveBeenCalled();
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
            expect(loggerDebugSpy).toHaveBeenCalledWith('Fetching activation data from disk...');
            expect(loggerDebugSpy).toHaveBeenCalledWith(
                `Activation directory ${activationDir} not found when searching for activation code.`
            );
            expect(loggerDebugSpy).toHaveBeenCalledWith('No activation JSON file found.');
        });

        it('should return null if no .activationcode file exists', async () => {
            vi.mocked(fs.access).mockResolvedValue(undefined);
            vi.mocked(fs.readdir).mockResolvedValue(['otherfile.txt' as any]);
            const result = await service.getActivationData();
            expect(result).toBeNull();
            expect(loggerDebugSpy).toHaveBeenCalledWith('No activation JSON file found.');
        });

        it('should return null and log error on readdir failure', async () => {
            const readDirError = new Error('Read dir permission denied');
            vi.mocked(fs.access).mockResolvedValue(undefined);
            vi.mocked(fs.readdir).mockRejectedValue(readDirError);
            const result = await service.getActivationData();
            expect(result).toBeNull();
            expect(loggerErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining('Error accessing activation directory'),
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
            // Provide data with an invalid hex color format
            const invalidHexData = {
                ...mockActivationData,
                branding: { ...mockActivationData.branding, header: 'not a hex color' },
            };
            vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(invalidHexData));

            // Validation should now pass because the transformer handles the invalid value
            const result = await service.getActivationData();

            expect(result).toBeInstanceOf(ActivationCode);
            // Check that the invalid hex was transformed to an empty string
            expect(result?.branding?.header).toBe('');
            // Check other valid fields remain
            expect(result?.branding?.theme).toBe(mockActivationData.branding.theme);
            // Validation errors are handled by validateOrReject throwing, not loggerErrorSpy here
            expect(loggerErrorSpy).not.toHaveBeenCalled();
        });

        // New Test: Check hex values without '#' are correctly prepended
        it('should correctly prepend # to hex colors provided without it', async () => {
            vi.mocked(fs.access).mockResolvedValue(undefined);
            vi.mocked(fs.readdir).mockResolvedValue([activationJsonFile as any]);
            const hexWithoutHashData = {
                ...mockActivationData,
                branding: {
                    ...mockActivationData.branding,
                    header: 'ABCDEF',
                    headermetacolor: '123',
                },
            };
            vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(hexWithoutHashData));

            const result = await service.getActivationData();

            expect(result).toBeInstanceOf(ActivationCode);
            expect(result?.branding?.header).toBe('#ABCDEF');
            expect(result?.branding?.headermetacolor).toBe('#123');
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
            (service as any).configFile = userDynamixCfg;
            (service as any).caseModelCfg = caseModelCfg;
            (service as any).identCfg = identCfg;
            (service as any).activationData = plainToInstance(ActivationCode, { ...mockActivationData });
            (service as any).activationJsonPath = activationJsonPath;
            (service as any).materializedPartnerMedia = {
                banner: true,
                caseModel: true,
            };
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
            expect(fs.copyFile).toHaveBeenCalledWith(
                bannerSource,
                expect.stringContaining(`${bannerTarget.fullPath}.tmp-`)
            );
            expect(loggerLogSpy).toHaveBeenCalledWith(
                `Partner banner found at ${bannerSource}, overwriting original.`
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
            // Mock access inside applyActivationCustomizations to fail
            vi.mocked(fs.access).mockRejectedValue(accessError);

            // Set up spies BEFORE calling the method
            const setupPartnerBannerSpy = vi.spyOn(service as any, 'setupPartnerBanner');
            const applyDisplaySettingsSpy = vi.spyOn(service as any, 'applyDisplaySettings');

            await (service as any).applyActivationCustomizations();

            expect(loggerWarnSpy).toHaveBeenCalledWith(
                'Activation directory disappeared after init? Skipping.'
            );
            // Ensure no customization methods were called implicitly by checking their side effects
            expect(setupPartnerBannerSpy).not.toHaveBeenCalled();
            expect(applyDisplaySettingsSpy).not.toHaveBeenCalled();
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
            expect(fs.copyFile).toHaveBeenCalledWith(
                bannerSource,
                expect.stringContaining(`${bannerTarget.fullPath}.tmp-`)
            );
            expect(loggerWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining(`Failed to replace the original banner`)
            );
        });

        it('materializes banner image from local path by symlinking into activation assets', async () => {
            const localBannerPath = path.join(activationDir, 'partner-assets/banner-custom.png');
            (service as any).activationJsonPath = activationJsonPath;
            (service as any).activationData = plainToInstance(ActivationCode, {
                branding: {
                    bannerImage: './partner-assets/banner-custom.png',
                },
            });

            vi.mocked(fileExists).mockImplementation(async (p) => p === localBannerPath);
            vi.mocked(fs.symlink).mockResolvedValue(undefined as any);
            await (service as any).materializePartnerMediaAssets();

            expect(fs.symlink).toHaveBeenCalledWith(localBannerPath, bannerSource);
        });

        it('materializes case-model image from remote URL into activation assets', async () => {
            const remoteBytes = Uint8Array.from([137, 80, 78, 71]).buffer;
            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: new Headers({ 'content-type': 'image/png' }),
                arrayBuffer: async () => remoteBytes,
            } as any);

            (service as any).activationData = plainToInstance(ActivationCode, {
                branding: {
                    caseModelImage: 'https://example.com/case-model.png',
                },
            });

            await (service as any).materializePartnerMediaAssets();

            expect(fetchSpy).toHaveBeenCalledWith('https://example.com/case-model.png', {
                signal: expect.any(AbortSignal),
            });
            expect(fs.writeFile).toHaveBeenCalledWith(
                caseModelSource,
                expect.objectContaining({
                    length: 4,
                })
            );
            fetchSpy.mockRestore();
        });

        it('normalizes partner logo local paths into browser-safe data URIs', async () => {
            const localLightLogoPath = path.join(activationDir, 'partner-assets/light-logo.svg');
            const localDarkLogoPath = path.join(activationDir, 'partner-assets/dark-logo.svg');
            (service as any).activationJsonPath = activationJsonPath;
            (service as any).activationData = plainToInstance(ActivationCode, {
                branding: {
                    partnerLogoLightUrl: './partner-assets/light-logo.svg',
                    partnerLogoDarkUrl: './partner-assets/dark-logo.svg',
                },
                partner: {
                    name: 'Partner Inc',
                },
            });

            vi.mocked(fileExists).mockImplementation(async (p) => {
                return p === localLightLogoPath || p === localDarkLogoPath;
            });
            vi.mocked(fs.readFile).mockImplementation(async (p) => {
                if (p === localLightLogoPath) {
                    return Buffer.from('<svg id="light"></svg>');
                }
                if (p === localDarkLogoPath) {
                    return Buffer.from('<svg id="dark"></svg>');
                }
                return '';
            });

            const partnerInfo = await service.getPublicPartnerInfo();

            expect(partnerInfo?.branding?.partnerLogoLightUrl).toMatch(/^data:image\/svg\+xml;base64,/);
            expect(partnerInfo?.branding?.partnerLogoDarkUrl).toMatch(/^data:image\/svg\+xml;base64,/);
            expect(partnerInfo?.branding?.hasPartnerLogo).toBe(true);
        });

        it('falls back to the light partner logo for dark themes when dark source is missing', async () => {
            const localLightLogoPath = path.join(activationDir, 'partner-assets/light-only-logo.svg');
            (service as any).activationJsonPath = activationJsonPath;
            (service as any).activationData = plainToInstance(ActivationCode, {
                branding: {
                    partnerLogoLightUrl: './partner-assets/light-only-logo.svg',
                },
            });

            vi.mocked(fileExists).mockImplementation(async (p) => {
                return p === localLightLogoPath;
            });
            vi.mocked(fs.readFile).mockImplementation(async (p) => {
                if (p === localLightLogoPath) {
                    return Buffer.from('<svg id="light"></svg>');
                }
                return '';
            });

            const partnerInfo = await service.getPublicPartnerInfo();

            expect(partnerInfo?.branding?.partnerLogoLightUrl).toMatch(/^data:image\/svg\+xml;base64,/);
            expect(partnerInfo?.branding?.partnerLogoDarkUrl).toBe(
                partnerInfo?.branding?.partnerLogoLightUrl
            );
        });

        it('applyDisplaySettings should call updateCfgFile with correct data (stripping #)', async () => {
            const updateSpy = vi.spyOn(service as any, 'updateCfgFile');
            vi.mocked(fileExists).mockResolvedValue(true); // Assume banner exists for banner: 'image' logic
            await (service as any).setupPartnerBanner(); // Run banner setup first
            await (service as any).applyDisplaySettings();
            // Expect the hash to be stripped and existing display settings preserved
            expect(updateSpy).toHaveBeenCalledWith(
                userDynamixCfg,
                'display',
                expect.objectContaining({
                    terminalButton: 'yes',
                    theme: 'azure',
                    header: '112233', // # stripped
                    headermetacolor: '445566', // # stripped
                    background: '778899', // # stripped
                    showBannerGradient: 'yes',
                    banner: 'image',
                })
            );
            expect(loggerLogSpy).toHaveBeenCalledWith('Display settings updated in config file.');
        });

        it('applyDisplaySettings should skip if no relevant activation data', async () => {
            const updateSpy = vi.spyOn(service as any, 'updateCfgFile');
            // Simulate empty DTO after plainToClass
            (service as any).activationData = plainToInstance(ActivationCode, {});
            vi.mocked(fileExists).mockResolvedValue(true); // Assume banner file exists
            await (service as any).setupPartnerBanner(); // Ensure banner='image' logic runs
            await (service as any).applyDisplaySettings();

            // Activation updates should merge into existing display settings
            expect(updateSpy).toHaveBeenCalledWith(
                userDynamixCfg,
                'display',
                expect.objectContaining({
                    terminalButton: 'yes',
                    theme: 'azure',
                    banner: 'image',
                })
            );
            expect(loggerLogSpy).toHaveBeenCalledWith('Display settings updated in config file.');
        });

        it('applyDisplaySettings should skip banner field if banner file does not exist', async () => {
            const updateSpy = vi.spyOn(service as any, 'updateCfgFile');
            (service as any).activationData = plainToInstance(ActivationCode, {
                branding: { theme: 'white' },
            }); // Some data, but no banner

            // Clear any previous mocks for fileExists and set a specific one for this test
            vi.mocked(fileExists).mockClear();
            // Ensure fileExists returns false specifically for the banner asset in this test
            vi.mocked(fileExists).mockImplementation(async (p) => {
                if (p === bannerSource) return false;
                // Allow other fileExists calls (if any) to potentially resolve true based on default mocks
                // This requires knowing if other fileExists calls happen. Assuming none for now.
                // If needed, chain mockResolvedValue(true) or adjust default mock setup.
                return false; // Default to false if other paths are checked unexpectedly
            });

            await (service as any).setupPartnerBanner(); // Run banner setup (will log skip)
            await (service as any).applyDisplaySettings();

            // Existing theme is preserved; default showBannerGradient is set from branding defaults.
            expect(updateSpy).toHaveBeenCalledWith(
                userDynamixCfg,
                'display',
                expect.objectContaining({
                    terminalButton: 'yes',
                    theme: 'azure',
                    showBannerGradient: 'yes',
                })
            );
            const updatePayload = (updateSpy.mock.calls.at(-1)?.[2] ?? {}) as Record<string, string>;
            expect(updatePayload.banner).toBeUndefined();
            expect(loggerLogSpy).toHaveBeenCalledWith('Display settings updated in config file.');
        });

        // Test for Failure 3 Fix
        it('applyDisplaySettings should handle empty string for invalid hex colors (skipping fields)', async () => {
            const updateSpy = vi.spyOn(service as any, 'updateCfgFile');
            // Simulate data after transformation results in empty strings
            (service as any).activationData = plainToInstance(ActivationCode, {
                ...mockActivationData,
                branding: {
                    ...mockActivationData.branding,
                    header: '', // Was invalid, transformed to empty
                    headermetacolor: '#445566', // Valid
                    background: '', // Was invalid, transformed to empty
                },
            });
            vi.mocked(fileExists).mockResolvedValue(true); // Assume banner file exists
            await (service as any).setupPartnerBanner(); // Run banner setup
            await (service as any).applyDisplaySettings();

            // Expect empty strings to be filtered out and valid hex stripped of #
            expect(updateSpy).toHaveBeenCalledWith(
                userDynamixCfg,
                'display',
                expect.objectContaining({
                    terminalButton: 'yes',
                    theme: 'azure',
                    headermetacolor: '445566', // '#' stripped (truthy)
                    showBannerGradient: 'yes',
                    banner: 'image',
                })
            );
            expect(loggerLogSpy).toHaveBeenCalledWith('Display settings updated in config file.');
        });

        // New Test: Verify behavior when '#' was added by the transformer
        it('applyDisplaySettings should handle hex colors where # was prepended (stripping #)', async () => {
            const updateSpy = vi.spyOn(service as any, 'updateCfgFile');
            // Simulate data after transformation where # was added
            (service as any).activationData = plainToInstance(ActivationCode, {
                ...mockActivationData,
                branding: {
                    ...mockActivationData.branding,
                    header: '#ABCDEF', // Originally 'ABCDEF', now includes #
                    headermetacolor: '#123', // Originally '123', now includes #
                    background: '#778899', // Original, includes #
                },
            });
            vi.mocked(fileExists).mockResolvedValue(true); // Assume banner exists
            await (service as any).setupPartnerBanner(); // Run banner setup
            await (service as any).applyDisplaySettings();

            // Expect '#' to be stripped by applyDisplaySettings before writing
            expect(updateSpy).toHaveBeenCalledWith(
                userDynamixCfg,
                'display',
                expect.objectContaining({
                    terminalButton: 'yes',
                    theme: 'azure',
                    header: 'ABCDEF',
                    headermetacolor: '123',
                    background: '778899',
                    showBannerGradient: 'yes',
                    banner: 'image',
                })
            );
            expect(loggerLogSpy).toHaveBeenCalledWith('Display settings updated in config file.');
        });

        it('applyCaseModelConfig should set model from asset if exists', async () => {
            vi.mocked(fileExists).mockImplementation(async (p) => p === caseModelSource); // Asset exists
            await (service as any).applyCaseModelConfig();
            expect(fs.copyFile).toHaveBeenCalledWith(
                caseModelSource,
                expect.stringContaining(`${caseModelTarget.fullPath}.tmp-`)
            );
            expect(fs.writeFile).toHaveBeenCalledWith(
                caseModelCfg,
                path.basename(caseModelTarget.fullPath)
            );
            expect(loggerLogSpy).toHaveBeenCalledWith(
                `Case model set to ${path.basename(caseModelTarget.fullPath)} in ${caseModelCfg}`
            );
        });

        it('applyCaseModelConfig should do nothing if asset missing', async () => {
            vi.mocked(fileExists).mockResolvedValue(false); // Asset missing
            await (service as any).applyCaseModelConfig();
            expect(fs.writeFile).not.toHaveBeenCalledWith(caseModelCfg, expect.any(String)); // Should not write
            expect(loggerLogSpy).toHaveBeenCalledWith(
                'No custom case model file found in activation assets.' // Updated log message check
            );
        });

        it('applyServerIdentity should call emcmd directly', async () => {
            const updateSpy = vi.spyOn(service as any, 'updateCfgFile');

            // Capture the emcmd call parameters
            let emcmdParams;
            vi.mocked(emcmd).mockImplementation(async (params, options) => {
                emcmdParams = { params, options };
                return { body: '', ok: true } as any;
            });

            const promise = (service as any).applyServerIdentity();
            await vi.runAllTimers();
            await promise;

            // We no longer update the config file before calling emcmd
            expect(updateSpy).not.toHaveBeenCalled();

            // Verify emcmd was called with expected parameters using inline snapshot
            expect(emcmdParams).toMatchInlineSnapshot(`
              {
                "options": {
                  "waitForToken": true,
                },
                "params": {
                  "COMMENT": "Partner Comment",
                  "NAME": "PartnerServer",
                  "SYS_MODEL": "PartnerModel",
                  "changeNames": "Apply",
                  "server_addr": "",
                  "server_name": "",
                },
              }
            `);

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
            (service as any).activationData = plainToInstance(ActivationCode, {
                branding: { theme: 'white' },
            });
            await (service as any).applyServerIdentity();
            expect(updateSpy).not.toHaveBeenCalled();
            expect(emcmd).not.toHaveBeenCalled();
            expect(loggerLogSpy).toHaveBeenCalledWith(
                'No server identity information found in activation data.'
            );
        });

        it('applyServerIdentity should log error on emcmd failure', async () => {
            const emcmdError = new Error('Failed to call emcmd');

            // Set up activation data directly
            (service as any).activationData = plainToInstance(ActivationCode, {
                system: {
                    serverName: 'PartnerServer',
                    model: 'PartnerModel',
                    comment: 'Partner Comment',
                },
            });

            // Mock emcmd to throw
            vi.mocked(emcmd).mockRejectedValue(emcmdError);

            // Clear previous log calls
            loggerErrorSpy.mockClear();

            // Call the method directly
            await (service as any).applyServerIdentity();

            // Verify the error was logged
            expect(emcmd).toHaveBeenCalled();
            expect(loggerErrorSpy).toHaveBeenCalledWith(
                'Error applying server identity: %o',
                emcmdError
            );
        }, 10000);

        it('applyServerIdentity should apply comment even when name/model are absent', async () => {
            (service as any).activationData = plainToInstance(ActivationCode, {
                system: {
                    comment: 'Partner Comment',
                },
            });

            let commentOnlyParams: Record<string, string> | undefined;
            vi.mocked(emcmd).mockImplementation(async (params) => {
                commentOnlyParams = params as Record<string, string>;
                return { body: '', ok: true } as any;
            });

            await (service as any).applyServerIdentity();

            expect(emcmd).toHaveBeenCalled();
            expect(commentOnlyParams).toMatchObject({
                COMMENT: 'Partner Comment',
                changeNames: 'Apply',
                server_addr: '',
                server_name: '',
            });
            expect(commentOnlyParams).not.toHaveProperty('NAME');
            expect(commentOnlyParams).not.toHaveProperty('SYS_MODEL');
        });

        it('applyServerIdentity should omit comment when activation data does not provide one', async () => {
            (service as any).activationData = plainToInstance(ActivationCode, {
                system: {
                    serverName: 'PartnerServer',
                    model: 'PartnerModel',
                },
            });

            let paramsWithoutComment: Record<string, string> | undefined;
            vi.mocked(emcmd).mockImplementation(async (params) => {
                paramsWithoutComment = params as Record<string, string>;
                return { body: '', ok: true } as any;
            });

            await (service as any).applyServerIdentity();

            expect(emcmd).toHaveBeenCalled();
            expect(paramsWithoutComment).toMatchObject({
                NAME: 'PartnerServer',
                SYS_MODEL: 'PartnerModel',
            });
            expect(paramsWithoutComment).not.toHaveProperty('COMMENT');
        });

        it('applyServerIdentity should allow explicitly empty comments from activation data', async () => {
            (service as any).activationData = plainToInstance(ActivationCode, {
                system: {
                    comment: '',
                },
            });

            let emptyCommentParams: Record<string, string> | undefined;
            vi.mocked(emcmd).mockImplementation(async (params) => {
                emptyCommentParams = params as Record<string, string>;
                return { body: '', ok: true } as any;
            });

            await (service as any).applyServerIdentity();

            expect(emcmd).toHaveBeenCalled();
            expect(emptyCommentParams).toMatchObject({
                COMMENT: '',
                changeNames: 'Apply',
                server_addr: '',
                server_name: '',
            });
        });

        it.each([
            {
                caseName: 'name only',
                system: { serverName: 'PartnerServer' },
                expected: { NAME: 'PartnerServer' },
                omitted: ['SYS_MODEL', 'COMMENT'],
            },
            {
                caseName: 'model only',
                system: { model: 'PartnerModel' },
                expected: { SYS_MODEL: 'PartnerModel' },
                omitted: ['NAME', 'COMMENT'],
            },
            {
                caseName: 'comment only',
                system: { comment: 'Partner Comment' },
                expected: { COMMENT: 'Partner Comment' },
                omitted: ['NAME', 'SYS_MODEL'],
            },
            {
                caseName: 'explicit empty comment',
                system: { comment: '' },
                expected: { COMMENT: '' },
                omitted: ['NAME', 'SYS_MODEL'],
            },
        ])(
            'applyServerIdentity should map partial identity fields correctly ($caseName)',
            async (scenario) => {
                (service as any).activationData = plainToInstance(ActivationCode, {
                    system: scenario.system,
                });

                let params: Record<string, string> | undefined;
                vi.mocked(emcmd).mockImplementation(async (incomingParams) => {
                    params = incomingParams as Record<string, string>;
                    return { body: '', ok: true } as any;
                });

                await (service as any).applyServerIdentity();

                expect(emcmd).toHaveBeenCalledTimes(1);
                expect(params).toMatchObject({
                    ...scenario.expected,
                    changeNames: 'Apply',
                    server_addr: '',
                    server_name: '',
                });
                scenario.omitted.forEach((key) => {
                    expect(params).not.toHaveProperty(key);
                });
            }
        );

        it('applyServerIdentity should truncate serverName if too long', async () => {
            const longServerName = 'ThisServerNameIsWayTooLongForUnraid'; // Length > 16
            const truncatedServerName = longServerName.slice(0, 15); // Expected truncated length
            // Simulate DTO with long serverName after plainToClass

            const testActivationParser = await plainToInstance(ActivationCode, {
                ...mockActivationData,
                system: { ...mockActivationData.system, serverName: longServerName },
            });

            expect(testActivationParser.system?.serverName).toBe(truncatedServerName);
        });

        it('applyServerIdentity should sanitize and truncate activation comments', async () => {
            const unsafeLongComment = `${'"\\'.repeat(40)}${'A'.repeat(100)}`;
            const parsedActivation = plainToInstance(ActivationCode, {
                system: {
                    comment: unsafeLongComment,
                },
            });

            expect(parsedActivation.system?.comment).toBeDefined();
            expect(parsedActivation.system?.comment).not.toMatch(/["\\]/);
            expect(parsedActivation.system?.comment!.length).toBeLessThanOrEqual(64);
        });

        it('applyServerIdentity should send sanitized identity values from transformed activation data', async () => {
            const unsafeIdentity = plainToInstance(ActivationCode, {
                system: {
                    serverName: 'Par"t\\nerServer',
                    model: 'Pa"rt\\nerModel',
                    comment: 'Partn"er\\Comment',
                },
            });
            (service as any).activationData = unsafeIdentity;

            let params: Record<string, string> | undefined;
            vi.mocked(emcmd).mockImplementation(async (incomingParams) => {
                params = incomingParams as Record<string, string>;
                return { body: '', ok: true } as any;
            });

            await (service as any).applyServerIdentity();

            expect(emcmd).toHaveBeenCalledTimes(1);
            expect(params).toMatchObject({
                NAME: 'PartnerServer',
                SYS_MODEL: 'PartnerModel',
                COMMENT: 'PartnerComment',
            });
            expect(params?.NAME).not.toMatch(/["\\]/);
            expect(params?.SYS_MODEL).not.toMatch(/["\\]/);
            expect(params?.COMMENT).not.toMatch(/["\\]/);
        });

        it('should correctly pass server_https parameter based on nginx state', async () => {
            // Mock getters.emhttp to include nginx with sslEnabled=true
            const mockEmhttpWithSsl = {
                nginx: { sslEnabled: true },
                var: { name: 'Tower', sysModel: 'Custom', comment: 'Default' },
            };
            vi.mocked(getters.emhttp).mockReturnValue(mockEmhttpWithSsl as any);

            // Set up the service's activationData field directly
            (service as any).activationData = plainToInstance(ActivationCode, {
                system: {
                    serverName: 'PartnerServer',
                    model: 'PartnerModel',
                    comment: 'Partner Comment',
                },
            });

            // Mock emcmd and capture the params for snapshot testing
            let sslEnabledParams;
            vi.mocked(emcmd).mockImplementation(async (params) => {
                sslEnabledParams = params;
                return { body: '', ok: true } as any;
            });

            // Call the method directly to test SSL enabled case
            await (service as any).applyServerIdentity();

            // Verify emcmd was called
            expect(emcmd).toHaveBeenCalled();
            // Use toMatchInlineSnapshot to compare the params
            expect(sslEnabledParams).toMatchInlineSnapshot(`
              {
                "COMMENT": "Partner Comment",
                "NAME": "PartnerServer",
                "SYS_MODEL": "PartnerModel",
                "changeNames": "Apply",
                "server_addr": "",
                "server_name": "",
              }
            `);

            // Now test with SSL disabled
            const mockEmhttpNoSsl = {
                nginx: { sslEnabled: false },
                var: { name: 'Tower', sysModel: 'Custom', comment: 'Default' },
            };
            vi.mocked(getters.emhttp).mockReturnValue(mockEmhttpNoSsl as any);

            // Update the mock to capture params for the second call
            let sslDisabledParams;
            vi.mocked(emcmd).mockImplementation(async (params) => {
                sslDisabledParams = params;
                return { body: '', ok: true } as any;
            });

            // Call again to test SSL disabled case
            await (service as any).applyServerIdentity();

            // Verify emcmd was called again
            expect(emcmd).toHaveBeenCalled();
            // Use toMatchInlineSnapshot to compare the params
            expect(sslDisabledParams).toMatchInlineSnapshot(`
              {
                "COMMENT": "Partner Comment",
                "NAME": "PartnerServer",
                "SYS_MODEL": "PartnerModel",
                "changeNames": "Apply",
                "server_addr": "",
                "server_name": "",
              }
            `);
        }, 10000);
    });
});

describe('applyActivationCustomizations specific tests', () => {
    let service: OnboardingService;
    let loggerLogSpy;
    let loggerWarnSpy;
    let loggerErrorSpy;
    let loggerDebugSpy;

    // Resolved mock paths
    const activationDir = mockPaths.activationBase;
    const userDynamixCfg = mockPaths['dynamix-config'][1];
    const caseModelCfg = mockPaths.boot.caseModelConfig;
    const identCfg = mockPaths.identConfig;
    const bannerSource = mockPaths.activation.banner;
    const bannerTarget = mockPaths.webgui.banner;
    const caseModelSource = mockPaths.activation.caseModel;
    const caseModelTarget = mockPaths.webgui.caseModel;

    // Add mockActivationData definition here
    const mockActivationData = {
        branding: {
            header: '#112233',
            headermetacolor: '#445566',
            background: '#778899',
            showBannerGradient: true,
            theme: 'black',
            bannerImage: './assets/banner.png',
            caseModelImage: './assets/case-model.png',
            partnerLogoLightUrl: './assets/partner-logo-light.png',
            partnerLogoDarkUrl: './assets/partner-logo-dark.png',
        },
        system: {
            serverName: 'PartnerServer',
            model: 'PartnerModel',
            comment: 'Partner Comment',
        },
    };

    beforeEach(async () => {
        // Re-initialize spies and service for this specific describe block
        vi.clearAllMocks();
        loggerDebugSpy = vi.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});
        loggerLogSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
        loggerWarnSpy = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
        loggerErrorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
        onboardingTrackerMock.isCompleted.mockReset();
        onboardingTrackerMock.isCompleted.mockReturnValue(false);
        onboardingOverridesMock.getState.mockReset();
        onboardingOverridesMock.getState.mockReturnValue(null);
        onboardingOverridesMock.setState.mockReset();
        onboardingOverridesMock.clearState.mockReset();
        onboardingStateMock.getRegistrationState.mockReset();
        onboardingStateMock.getRegistrationState.mockReturnValue(undefined);
        onboardingStateMock.hasActivationCode.mockReset();
        onboardingStateMock.hasActivationCode.mockResolvedValue(false);
        onboardingStateMock.isFreshInstall.mockReset();
        onboardingStateMock.isFreshInstall.mockReturnValue(false);
        onboardingStateMock.requiresActivationStep.mockReset();
        onboardingStateMock.requiresActivationStep.mockReturnValue(false);
        onboardingStateMock.isRegistered.mockReset();
        onboardingStateMock.isRegistered.mockReturnValue(false);
        vi.mocked(fs.mkdir).mockResolvedValue(undefined as any);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OnboardingService,
                { provide: OnboardingTrackerService, useValue: onboardingTrackerMock },
                { provide: OnboardingOverrideService, useValue: onboardingOverridesMock },
                { provide: OnboardingStateService, useValue: onboardingStateMock },
            ],
        }).compile();
        service = module.get<OnboardingService>(OnboardingService);

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
            return p === bannerSource || p === caseModelSource || p === bannerTarget.fullPath;
        });
    });

    it('should log warning and skip if activation dir disappears after init', async () => {
        const accessError = new Error('ENOENT') as NodeJS.ErrnoException;
        accessError.code = 'ENOENT';
        // Mock access inside applyActivationCustomizations to fail
        vi.mocked(fs.access).mockRejectedValue(accessError);

        // Set up spies BEFORE calling the method
        const setupPartnerBannerSpy = vi.spyOn(service as any, 'setupPartnerBanner');
        const applyDisplaySettingsSpy = vi.spyOn(service as any, 'applyDisplaySettings');

        await (service as any).applyActivationCustomizations();

        expect(loggerWarnSpy).toHaveBeenCalledWith(
            'Activation directory disappeared after init? Skipping.'
        );
        // Ensure no customization methods were called implicitly by checking their side effects
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
        expect(loggerLogSpy).not.toHaveBeenCalledWith('Applying server identity...');

        // Overall error from applyActivationCustomizations' catch block
        // REMOVED: expect(loggerErrorSpy).toHaveBeenCalledWith('Error during activation setup:', updateError);
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
        expect(loggerErrorSpy).toHaveBeenCalledWith('Error applying case model:', writeError);
        // Other steps should still run
        expect(loggerLogSpy).toHaveBeenCalledWith('Setting up partner banner...');
        expect(loggerLogSpy).toHaveBeenCalledWith('Applying display settings...');
        expect(loggerLogSpy).not.toHaveBeenCalledWith('Applying server identity...');

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
            return p === bannerSource || p === bannerTarget.fullPath;
        });

        await (service as any).applyActivationCustomizations();

        // Case model materialization failed, so case model apply step is skipped safely.
        expect(loggerWarnSpy).toHaveBeenCalledWith(
            expect.stringContaining(
                `Failed to materialize activation case-model asset: ${existsError.message}`
            )
        );
        expect(loggerLogSpy).toHaveBeenCalledWith(
            'No partner case-model image configured in activation code, skipping case model setup.'
        );

        // Other steps should still run
        expect(loggerLogSpy).toHaveBeenCalledWith('Setting up partner banner...');
        expect(loggerLogSpy).toHaveBeenCalledWith('Applying display settings...');
        expect(loggerLogSpy).not.toHaveBeenCalledWith('Applying server identity...');

        // Overall error from applyActivationCustomizations' catch block
        // REMOVED: expect(loggerErrorSpy).toHaveBeenCalledWith('Error during activation setup:', existsError);
    }, 10000);

    it('should continue through chained banner/case-model failures without applying identity', async () => {
        const bannerCopyError = new Error('Banner copy failed');
        const caseModelWriteError = new Error('Case model write failed');
        (service as any).activationData = plainToInstance(ActivationCode, {
            system: {
                serverName: 'PartnerServer',
                model: 'PartnerModel',
                comment: 'Partner Comment',
            },
            branding: {
                header: '#112233',
                bannerImage: './assets/banner.png',
                caseModelImage: './assets/case-model.png',
            },
        });

        vi.mocked(fileExists).mockImplementation(async (p) => {
            return p === bannerSource || p === caseModelSource || p === bannerTarget.fullPath;
        });
        vi.mocked(fs.copyFile).mockImplementation(async (source, dest) => {
            if (
                source === bannerSource &&
                typeof dest === 'string' &&
                dest.startsWith(`${bannerTarget.fullPath}.tmp-`)
            ) {
                throw bannerCopyError;
            }
        });
        vi.mocked(fs.writeFile).mockImplementation(async (filePath) => {
            if (filePath === caseModelCfg) {
                throw caseModelWriteError;
            }
        });

        await (service as any).applyActivationCustomizations();

        expect(loggerWarnSpy).toHaveBeenCalledWith(
            `Failed to replace the original banner with the partner banner: ${bannerCopyError.message}`
        );
        expect(loggerErrorSpy).toHaveBeenCalledWith('Error applying case model:', caseModelWriteError);
        expect(emcmd).not.toHaveBeenCalled();
    }, 10000);

    // We no longer update config files in applyServerIdentity, so this test is removed
});

// Standalone tests for updateCfgFile utility function within the service
describe('OnboardingService - updateCfgFile', () => {
    let service: OnboardingService;
    let loggerLogSpy;
    let loggerErrorSpy;
    const filePath = '/test/config.cfg';

    beforeEach(async () => {
        vi.clearAllMocks();
        loggerLogSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
        loggerErrorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
        onboardingTrackerMock.isCompleted.mockReset();
        onboardingTrackerMock.isCompleted.mockReturnValue(false);
        onboardingOverridesMock.getState.mockReset();
        onboardingOverridesMock.getState.mockReturnValue(null);
        onboardingOverridesMock.setState.mockReset();
        onboardingOverridesMock.clearState.mockReset();
        onboardingStateMock.getRegistrationState.mockReset();
        onboardingStateMock.getRegistrationState.mockReturnValue(undefined);
        onboardingStateMock.hasActivationCode.mockReset();
        onboardingStateMock.hasActivationCode.mockResolvedValue(false);
        onboardingStateMock.isFreshInstall.mockReset();
        onboardingStateMock.isFreshInstall.mockReturnValue(false);
        onboardingStateMock.requiresActivationStep.mockReset();
        onboardingStateMock.requiresActivationStep.mockReturnValue(false);
        onboardingStateMock.isRegistered.mockReset();
        onboardingStateMock.isRegistered.mockReturnValue(false);
        vi.mocked(fs.mkdir).mockResolvedValue(undefined as any);

        // Need to compile a module to get an instance, even though we test a private method
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OnboardingService,
                { provide: OnboardingTrackerService, useValue: onboardingTrackerMock },
                { provide: OnboardingOverrideService, useValue: onboardingOverridesMock },
                { provide: OnboardingStateService, useValue: onboardingStateMock },
            ],
        }).compile();
        service = module.get<OnboardingService>(OnboardingService);

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

    it('should preserve quoted yes/no-style values in display section writes', async () => {
        const section = 'display';
        const updates = { theme: 'white' };
        const existingData = '[display]\nterminalButton="yes"\n';
        vi.mocked(fs.readFile).mockResolvedValue(existingData);

        await (service as any).updateCfgFile(filePath, section, updates);

        expect(fs.writeFile).toHaveBeenCalledOnce();
        const writeArgs = vi.mocked(fs.writeFile).mock.calls[0];
        const writtenRaw = writeArgs[1] as string;
        expect(writtenRaw).toContain('terminalButton="yes"');

        const writtenContent = ini.parse(writtenRaw);
        expect((writtenContent.display as Record<string, string>).terminalButton).toBe('yes');
        expect((writtenContent.display as Record<string, string>).theme).toBe('white');
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

    describe('getTheme', () => {
        const mockDynamix = getters.dynamix as unknown as Mock;
        const baseDisplay = {
            theme: 'white',
            banner: '',
            showBannerGradient: 'no',
            background: '123456',
            headerdescription: 'yes',
            headermetacolor: '789abc',
            header: 'abcdef',
        };

        const setDisplay = (overrides: Partial<typeof baseDisplay>) => {
            mockDynamix.mockReturnValue({
                display: {
                    ...baseDisplay,
                    ...overrides,
                },
            });
        };

        it('reports showBannerImage when banner is "image"', async () => {
            setDisplay({ banner: 'image' });

            const theme = await service.getTheme();

            expect(theme.showBannerImage).toBe(true);
        });

        it('reports showBannerImage when banner is "yes"', async () => {
            setDisplay({ banner: 'yes' });

            const theme = await service.getTheme();

            expect(theme.showBannerImage).toBe(true);
        });

        it('disables showBannerImage when banner is empty', async () => {
            setDisplay({ banner: '' });

            const theme = await service.getTheme();

            expect(theme.showBannerImage).toBe(false);
        });

        it('mirrors showBannerGradient flag from display settings', async () => {
            setDisplay({ banner: 'image', showBannerGradient: 'yes' });
            expect((await service.getTheme()).showBannerGradient).toBe(true);

            setDisplay({ banner: 'image', showBannerGradient: 'no' });
            expect((await service.getTheme()).showBannerGradient).toBe(false);
        });
    });
});
