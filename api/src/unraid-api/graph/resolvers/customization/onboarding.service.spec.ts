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
import {
    ActivationCode,
    OnboardingStatus,
    OnboardingWizardBootMode,
    OnboardingWizardPoolMode,
    OnboardingWizardStepId,
} from '@app/unraid-api/graph/resolvers/customization/activation-code.model.js';
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
    isCompleted: vi.fn<() => Promise<boolean>>(),
    getStateResult: vi.fn(),
    getCurrentVersion: vi.fn(),
    isBypassed: vi.fn<() => boolean>(),
    markCompleted:
        vi.fn<() => Promise<{ completed: boolean; completedAtVersion?: string; forceOpen: boolean }>>(),
    reset: vi.fn<
        () => Promise<{ completed: boolean; completedAtVersion?: string; forceOpen: boolean }>
    >(),
    setForceOpen:
        vi.fn<
            (
                forceOpen: boolean
            ) => Promise<{ completed: boolean; completedAtVersion?: string; forceOpen: boolean }>
        >(),
    setBypassActive: vi.fn<(active: boolean) => void>(),
    clearWizardState: vi.fn(),
    saveDraft: vi.fn(),
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
        onboardingTrackerMock.isCompleted.mockResolvedValue(false);
        onboardingTrackerMock.getStateResult.mockReset();
        onboardingTrackerMock.getStateResult.mockResolvedValue({
            kind: 'ok',
            state: {
                completed: false,
                completedAtVersion: undefined,
                forceOpen: false,
                draft: {},
                navigation: {},
                internalBootState: {
                    applyAttempted: false,
                    applySucceeded: false,
                },
            },
        });
        onboardingTrackerMock.getCurrentVersion.mockReset();
        onboardingTrackerMock.getCurrentVersion.mockReturnValue('7.2.0');
        onboardingTrackerMock.isBypassed.mockReset();
        onboardingTrackerMock.isBypassed.mockReturnValue(false);
        onboardingTrackerMock.markCompleted.mockReset();
        onboardingTrackerMock.markCompleted.mockResolvedValue({
            completed: true,
            completedAtVersion: '7.2.0',
            forceOpen: false,
        });
        onboardingTrackerMock.reset.mockReset();
        onboardingTrackerMock.reset.mockResolvedValue({
            completed: false,
            completedAtVersion: undefined,
            forceOpen: false,
        });
        onboardingTrackerMock.setForceOpen.mockReset();
        onboardingTrackerMock.setForceOpen.mockImplementation(async (forceOpen: boolean) => ({
            completed: false,
            completedAtVersion: undefined,
            forceOpen,
        }));
        onboardingTrackerMock.setBypassActive.mockReset();
        onboardingTrackerMock.saveDraft.mockReset();
        onboardingTrackerMock.saveDraft.mockResolvedValue({
            completed: false,
            completedAtVersion: undefined,
            forceOpen: false,
            draft: {},
            navigation: {},
            internalBootState: {
                applyAttempted: false,
                applySucceeded: false,
            },
        });
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

    describe('getOnboardingResponse', () => {
        it('builds an onboarding response with activation code when requested', async () => {
            onboardingTrackerMock.getStateResult.mockResolvedValue({
                kind: 'ok',
                state: {
                    completed: true,
                    completedAtVersion: '7.2.0',
                },
            });
            onboardingTrackerMock.getCurrentVersion.mockReturnValue('7.2.0');
            onboardingStateMock.getRegistrationState.mockReturnValue('PRO');
            onboardingStateMock.hasActivationCode.mockResolvedValue(true);
            onboardingStateMock.isFreshInstall.mockReturnValue(false);
            onboardingStateMock.isRegistered.mockReturnValue(true);
            onboardingStateMock.requiresActivationStep.mockReturnValue(false);

            vi.spyOn(service, 'getPublicPartnerInfo').mockResolvedValue({
                partner: { name: 'Partner' },
                branding: undefined,
            });
            vi.spyOn(service, 'getActivationData').mockResolvedValue(
                plainToInstance(ActivationCode, {
                    code: ' ABC123 ',
                })
            );

            await expect(
                service.getOnboardingResponse({ includeActivationCode: true })
            ).resolves.toMatchObject({
                status: OnboardingStatus.COMPLETED,
                isPartnerBuild: true,
                completed: true,
                completedAtVersion: '7.2.0',
                activationCode: 'ABC123',
                shouldOpen: false,
                onboardingState: {
                    registrationState: 'PRO',
                    isRegistered: true,
                    isFreshInstall: false,
                    hasActivationCode: true,
                    activationRequired: false,
                },
                wizard: {
                    currentStepId: OnboardingWizardStepId.OVERVIEW,
                },
            });
        });

        it('omits activation code when it is not requested', async () => {
            vi.spyOn(service, 'getPublicPartnerInfo').mockResolvedValue(null);
            vi.spyOn(service, 'getActivationData');

            await expect(service.getOnboardingResponse()).resolves.toMatchObject({
                status: OnboardingStatus.INCOMPLETE,
                completed: false,
                completedAtVersion: undefined,
            });
            expect(service.getActivationData).not.toHaveBeenCalled();
        });

        it('throws when tracker state is unavailable', async () => {
            onboardingTrackerMock.getStateResult.mockResolvedValue({
                kind: 'error',
                error: new Error('permission denied'),
            });

            await expect(service.getOnboardingResponse()).rejects.toThrow(
                'Onboarding tracker state is unavailable.'
            );
        });

        it('treats a missing tracker file as incomplete onboarding state', async () => {
            onboardingTrackerMock.getStateResult.mockResolvedValue({
                kind: 'missing',
                state: {
                    completed: false,
                    completedAtVersion: undefined,
                },
            });
            vi.spyOn(service, 'getPublicPartnerInfo').mockResolvedValue(null);
            vi.spyOn(service, 'getActivationData');

            await expect(service.getOnboardingResponse()).resolves.toMatchObject({
                status: OnboardingStatus.INCOMPLETE,
                completed: false,
                completedAtVersion: undefined,
            });
            expect(service.getActivationData).not.toHaveBeenCalled();
        });

        it('returns UPGRADE when onboarding was completed on an older minor version', async () => {
            onboardingTrackerMock.getStateResult.mockResolvedValue({
                kind: 'ok',
                state: {
                    completed: true,
                    completedAtVersion: '7.2.4',
                },
            });
            onboardingTrackerMock.getCurrentVersion.mockReturnValue('7.3.0');
            vi.spyOn(service, 'getPublicPartnerInfo').mockResolvedValue(null);

            await expect(service.getOnboardingResponse()).resolves.toMatchObject({
                status: OnboardingStatus.UPGRADE,
                completed: true,
                completedAtVersion: '7.2.4',
                shouldOpen: false,
            });
        });

        it('auto-opens incomplete onboarding for supported versions', async () => {
            onboardingTrackerMock.getStateResult.mockResolvedValue({
                kind: 'ok',
                state: {
                    completed: false,
                    completedAtVersion: undefined,
                    forceOpen: false,
                },
            });
            onboardingTrackerMock.getCurrentVersion.mockReturnValue('7.3.0');
            onboardingStateMock.isFreshInstall.mockReturnValue(true);
            vi.spyOn(service, 'getPublicPartnerInfo').mockResolvedValue(null);

            await expect(service.getOnboardingResponse()).resolves.toMatchObject({
                status: OnboardingStatus.INCOMPLETE,
                shouldOpen: true,
            });
        });

        it('auto-opens incomplete onboarding for licensed users on supported versions', async () => {
            onboardingTrackerMock.getStateResult.mockResolvedValue({
                kind: 'ok',
                state: {
                    completed: false,
                    completedAtVersion: undefined,
                    forceOpen: false,
                },
            });
            onboardingTrackerMock.getCurrentVersion.mockReturnValue('7.3.0');
            onboardingStateMock.getRegistrationState.mockReturnValue('PRO');
            onboardingStateMock.hasActivationCode.mockResolvedValue(false);
            onboardingStateMock.isFreshInstall.mockReturnValue(false);
            onboardingStateMock.isRegistered.mockReturnValue(true);
            onboardingStateMock.requiresActivationStep.mockReturnValue(false);
            vi.spyOn(service, 'getPublicPartnerInfo').mockResolvedValue(null);

            await expect(service.getOnboardingResponse()).resolves.toMatchObject({
                status: OnboardingStatus.INCOMPLETE,
                shouldOpen: true,
                onboardingState: {
                    registrationState: 'PRO',
                    isRegistered: true,
                    isFreshInstall: false,
                    hasActivationCode: false,
                    activationRequired: false,
                },
            });
        });

        it('does not auto-open completed upgrade onboarding from the backend response', async () => {
            onboardingTrackerMock.getStateResult.mockResolvedValue({
                kind: 'ok',
                state: {
                    completed: true,
                    completedAtVersion: '7.2.4',
                    forceOpen: false,
                },
            });
            onboardingTrackerMock.getCurrentVersion.mockReturnValue('7.3.0');
            onboardingStateMock.isFreshInstall.mockReturnValue(false);
            vi.spyOn(service, 'getPublicPartnerInfo').mockResolvedValue(null);

            await expect(service.getOnboardingResponse()).resolves.toMatchObject({
                status: OnboardingStatus.UPGRADE,
                shouldOpen: false,
            });
        });

        it('surfaces forced-open onboarding from the backend response', async () => {
            onboardingTrackerMock.getStateResult.mockResolvedValue({
                kind: 'ok',
                state: {
                    completed: true,
                    completedAtVersion: '7.2.4',
                    forceOpen: true,
                },
            });
            onboardingTrackerMock.getCurrentVersion.mockReturnValue('7.3.0');
            onboardingStateMock.isFreshInstall.mockReturnValue(false);
            vi.spyOn(service, 'getPublicPartnerInfo').mockResolvedValue(null);

            await expect(service.getOnboardingResponse()).resolves.toMatchObject({
                status: OnboardingStatus.UPGRADE,
                shouldOpen: true,
            });
        });

        it('hides onboarding when the in-memory bypass is active', async () => {
            onboardingTrackerMock.getStateResult.mockResolvedValue({
                kind: 'ok',
                state: {
                    completed: false,
                    completedAtVersion: undefined,
                    forceOpen: false,
                },
            });
            onboardingTrackerMock.getCurrentVersion.mockReturnValue('7.3.0');
            onboardingStateMock.isFreshInstall.mockReturnValue(true);
            onboardingTrackerMock.isBypassed.mockReturnValue(true);
            vi.spyOn(service, 'getPublicPartnerInfo').mockResolvedValue(null);

            await expect(service.getOnboardingResponse()).resolves.toMatchObject({
                status: OnboardingStatus.INCOMPLETE,
                shouldOpen: false,
            });
        });

        it('returns COMPLETED when onboarding was completed on an earlier patch of the same minor version', async () => {
            onboardingTrackerMock.getStateResult.mockResolvedValue({
                kind: 'ok',
                state: {
                    completed: true,
                    completedAtVersion: '7.3.0',
                },
            });
            onboardingTrackerMock.getCurrentVersion.mockReturnValue('7.3.1');
            vi.spyOn(service, 'getPublicPartnerInfo').mockResolvedValue(null);

            await expect(service.getOnboardingResponse()).resolves.toMatchObject({
                status: OnboardingStatus.COMPLETED,
                completed: true,
                completedAtVersion: '7.3.0',
                shouldOpen: false,
            });
        });

        it('returns DOWNGRADE when onboarding was completed on a newer minor version', async () => {
            onboardingTrackerMock.getStateResult.mockResolvedValue({
                kind: 'ok',
                state: {
                    completed: true,
                    completedAtVersion: '7.3.0',
                },
            });
            onboardingTrackerMock.getCurrentVersion.mockReturnValue('7.2.4');
            vi.spyOn(service, 'getPublicPartnerInfo').mockResolvedValue(null);

            await expect(service.getOnboardingResponse()).resolves.toMatchObject({
                status: OnboardingStatus.DOWNGRADE,
                completed: true,
                completedAtVersion: '7.3.0',
            });
        });
    });

    describe('visibility actions', () => {
        it('delegates openOnboarding to the tracker', async () => {
            await service.openOnboarding();

            expect(onboardingTrackerMock.setBypassActive).toHaveBeenCalledWith(false);
            expect(onboardingTrackerMock.setForceOpen).toHaveBeenCalledWith(true);
        });

        it('clears forced-open onboarding through the tracker', async () => {
            onboardingTrackerMock.getStateResult.mockResolvedValue({
                kind: 'ok',
                state: {
                    completed: true,
                    completedAtVersion: '7.3.0',
                    forceOpen: true,
                },
            });

            await service.closeOnboarding();

            expect(onboardingTrackerMock.setForceOpen).toHaveBeenCalledWith(false);
            expect(onboardingTrackerMock.clearWizardState).toHaveBeenCalledTimes(1);
        });

        it('marks incomplete onboarding complete when closed on supported versions', async () => {
            onboardingTrackerMock.getStateResult.mockResolvedValue({
                kind: 'ok',
                state: {
                    completed: false,
                    completedAtVersion: undefined,
                    forceOpen: false,
                },
            });
            onboardingTrackerMock.getCurrentVersion.mockReturnValue('7.3.0');
            onboardingStateMock.isFreshInstall.mockReturnValue(true);

            await service.closeOnboarding();

            expect(onboardingTrackerMock.markCompleted).toHaveBeenCalledTimes(1);
            expect(onboardingTrackerMock.setForceOpen).not.toHaveBeenCalled();
            expect(onboardingTrackerMock.clearWizardState).not.toHaveBeenCalled();
        });

        it('marks licensed incomplete onboarding complete when closed on supported versions', async () => {
            onboardingTrackerMock.getStateResult.mockResolvedValue({
                kind: 'ok',
                state: {
                    completed: false,
                    completedAtVersion: undefined,
                    forceOpen: false,
                },
            });
            onboardingTrackerMock.getCurrentVersion.mockReturnValue('7.3.0');
            onboardingStateMock.getRegistrationState.mockReturnValue('PRO');
            onboardingStateMock.isRegistered.mockReturnValue(true);
            onboardingStateMock.hasActivationCode.mockResolvedValue(false);
            onboardingStateMock.requiresActivationStep.mockReturnValue(false);
            onboardingStateMock.isFreshInstall.mockReturnValue(false);

            await service.closeOnboarding();

            expect(onboardingTrackerMock.markCompleted).toHaveBeenCalledTimes(1);
            expect(onboardingTrackerMock.setForceOpen).not.toHaveBeenCalled();
            expect(onboardingTrackerMock.clearWizardState).not.toHaveBeenCalled();
        });

        it('closes force-opened fresh incomplete onboarding in one action', async () => {
            onboardingTrackerMock.getStateResult.mockResolvedValue({
                kind: 'ok',
                state: {
                    completed: false,
                    completedAtVersion: undefined,
                    forceOpen: true,
                },
            });
            onboardingTrackerMock.getCurrentVersion.mockReturnValue('7.3.0');
            onboardingStateMock.isFreshInstall.mockReturnValue(true);

            await service.closeOnboarding();

            expect(onboardingTrackerMock.setForceOpen).toHaveBeenCalledWith(false);
            expect(onboardingTrackerMock.markCompleted).toHaveBeenCalledTimes(1);
            expect(onboardingTrackerMock.clearWizardState).not.toHaveBeenCalled();
        });

        it('enables the in-memory bypass', async () => {
            await service.bypassOnboarding();

            expect(onboardingTrackerMock.setBypassActive).toHaveBeenCalledWith(true);
        });

        it('clears the in-memory bypass', async () => {
            await service.resumeOnboarding();

            expect(onboardingTrackerMock.setBypassActive).toHaveBeenCalledWith(false);
        });
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
            onboardingTrackerMock.isCompleted.mockResolvedValueOnce(true);

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
                .mockResolvedValueOnce(false) // first init applies customizations
                .mockResolvedValueOnce(true); // second init should skip
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
            // We already mock fs.writeFile, so we can check calls to userDynamixCfg
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
            (service as any).activationData = plainToInstance(ActivationCode, { ...mockActivationData });
            (service as any).activationJsonPath = activationJsonPath;
            (service as any).materializedPartnerMedia = {
                banner: true,
                caseModel: true,
            };
            // Mock necessary file reads/writes
            vi.mocked(fs.readFile).mockImplementation(async (p) => {
                if (p === userDynamixCfg) return ini.stringify({ display: { existing: 'value' } });
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

        it('applyCaseModelConfig should write the built-in case model when no custom asset exists', async () => {
            (service as any).activationData = plainToInstance(ActivationCode, {
                ...mockActivationData,
                branding: {
                    ...mockActivationData.branding,
                    caseModel: 'mid-tower',
                    caseModelImage: null,
                },
            });
            (service as any).materializedPartnerMedia = {
                banner: true,
                caseModel: false,
            };
            vi.mocked(fileExists).mockResolvedValue(false);

            await (service as any).applyCaseModelConfig();

            expect(fs.writeFile).toHaveBeenCalledWith(caseModelCfg, 'mid-tower');
            expect(loggerLogSpy).toHaveBeenCalledWith(`Case model set to mid-tower in ${caseModelCfg}`);
        });
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
        onboardingTrackerMock.isCompleted.mockResolvedValue(false);
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
        (service as any).activationData = plainToInstance(ActivationCode, { ...mockActivationData });

        // Default mocks for dependencies, override in specific tests if needed
        vi.mocked(fs.copyFile).mockResolvedValue(undefined);
        vi.mocked(fs.writeFile).mockResolvedValue(undefined);
        vi.mocked(emcmd).mockResolvedValue({ body: '', ok: true } as any);
        vi.mocked(fs.access).mockResolvedValue(undefined); // Assume dirs/files accessible by default
        vi.mocked(fs.readFile).mockImplementation(async (p) => {
            if (p === userDynamixCfg) return ini.stringify({});
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
            'No partner case-model configured in activation code, skipping case model setup.'
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
        onboardingTrackerMock.isCompleted.mockResolvedValue(false);
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

    describe('wizard state', () => {
        const mockEmhttp = getters.emhttp as unknown as Mock;

        it('returns live-computed visible steps and falls forward when the saved current step is hidden', async () => {
            mockEmhttp.mockReturnValue({
                var: {
                    name: 'Tower',
                    sysModel: 'Custom',
                    comment: 'Default',
                    enableBootTransfer: 'no',
                },
            });
            onboardingTrackerMock.getStateResult.mockResolvedValue({
                kind: 'ok',
                state: {
                    completed: false,
                    completedAtVersion: undefined,
                    forceOpen: false,
                    draft: {
                        plugins: {
                            selectedIds: ['community.applications'],
                        },
                    },
                    navigation: {
                        currentStepId: 'CONFIGURE_BOOT',
                    },
                    internalBootState: {
                        applyAttempted: true,
                        applySucceeded: false,
                    },
                },
            });
            onboardingTrackerMock.getCurrentVersion.mockReturnValue('7.3.0');
            onboardingStateMock.getRegistrationState.mockReturnValue('PRO');
            onboardingStateMock.isRegistered.mockReturnValue(true);
            onboardingStateMock.isFreshInstall.mockReturnValue(true);
            onboardingStateMock.hasActivationCode.mockResolvedValue(false);
            onboardingStateMock.requiresActivationStep.mockReturnValue(false);
            vi.spyOn(service, 'getPublicPartnerInfo').mockResolvedValue(null);

            const response = await service.getOnboardingResponse();

            expect(response.status).toBe(OnboardingStatus.INCOMPLETE);
            expect(response.wizard.visibleStepIds).toEqual([
                OnboardingWizardStepId.OVERVIEW,
                OnboardingWizardStepId.CONFIGURE_SETTINGS,
                OnboardingWizardStepId.ADD_PLUGINS,
                OnboardingWizardStepId.SUMMARY,
                OnboardingWizardStepId.NEXT_STEPS,
            ]);
            expect(response.wizard.currentStepId).toBe(OnboardingWizardStepId.ADD_PLUGINS);
            expect(response.wizard.internalBootState).toEqual({
                applyAttempted: true,
                applySucceeded: false,
            });
        });

        it('persists nested wizard draft input in tracker format', async () => {
            await service.saveOnboardingDraft({
                draft: {
                    coreSettings: {
                        serverName: 'Tower',
                        timeZone: 'America/New_York',
                    },
                    internalBoot: {
                        bootMode: OnboardingWizardBootMode.STORAGE,
                        skipped: false,
                        selection: {
                            poolName: 'cache',
                            slotCount: 2,
                            devices: ['disk1', 'disk2'],
                            bootSizeMiB: 32768,
                            updateBios: true,
                            poolMode: OnboardingWizardPoolMode.HYBRID,
                        },
                    },
                },
                navigation: {
                    currentStepId: OnboardingWizardStepId.SUMMARY,
                },
                internalBootState: {
                    applyAttempted: true,
                    applySucceeded: true,
                },
            });

            expect(onboardingTrackerMock.saveDraft).toHaveBeenCalledWith({
                draft: {
                    coreSettings: {
                        serverName: 'Tower',
                        timeZone: 'America/New_York',
                    },
                    internalBoot: {
                        bootMode: 'storage',
                        skipped: false,
                        selection: {
                            poolName: 'cache',
                            slotCount: 2,
                            devices: ['disk1', 'disk2'],
                            bootSizeMiB: 32768,
                            updateBios: true,
                            poolMode: 'hybrid',
                        },
                    },
                },
                navigation: {
                    currentStepId: OnboardingWizardStepId.SUMMARY,
                },
                internalBootState: {
                    applyAttempted: true,
                    applySucceeded: true,
                },
            });
        });
    });
});
