import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

import { plainToClass } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { GraphQLError } from 'graphql';
import * as ini from 'ini';

import { emcmd } from '@app/core/utils/clients/emcmd.js';
import { fileExists } from '@app/core/utils/files/file-exists.js';
import { safelySerializeObjectToIni } from '@app/core/utils/files/safe-ini-serializer.js';
import { loadDynamixConfigFromDiskSync } from '@app/store/actions/load-dynamix-config-file.js';
import { getters, store } from '@app/store/index.js';
import { updateDynamixConfig } from '@app/store/modules/dynamix.js';
import { OnboardingOverrideService } from '@app/unraid-api/config/onboarding-override.service.js';
import { OnboardingStateService } from '@app/unraid-api/config/onboarding-state.service.js';
import { OnboardingTrackerService } from '@app/unraid-api/config/onboarding-tracker.module.js';
import {
    ActivationCode,
    BrandingConfig,
    OnboardingState,
    PublicPartnerInfo,
} from '@app/unraid-api/graph/resolvers/customization/activation-code.model.js';
import {
    findActivationCodeFile,
    getActivationDirCandidates,
} from '@app/unraid-api/graph/resolvers/customization/activation-steps.util.js';
import { Theme, ThemeName } from '@app/unraid-api/graph/resolvers/customization/theme.model.js';

@Injectable()
export class OnboardingService implements OnModuleInit {
    private readonly logger = new Logger(OnboardingService.name);
    private readonly activationJsonExtension = '.activationcode';
    private readonly maxActivationImageBytes = 10 * 1024 * 1024;
    private activationDir!: string;
    private configFile!: string;
    private caseModelCfg!: string;
    private identCfg!: string;
    private activationJsonPath: string | null = null;
    private materializedPartnerMedia: Record<'banner' | 'caseModel', boolean> = {
        banner: false,
        caseModel: false,
    };

    private activationData: ActivationCode | null = null;

    constructor(
        private readonly onboardingTracker: OnboardingTrackerService,
        private readonly onboardingOverrides: OnboardingOverrideService,
        private readonly onboardingState: OnboardingStateService
    ) {}

    private async ensureFirstBootCompletion(): Promise<boolean> {
        await fs.mkdir(this.activationDir, { recursive: true });
        // Check if onboarding has already been completed
        const alreadyCompleted = this.onboardingTracker.isCompleted();
        if (alreadyCompleted) {
            this.logger.log('Onboarding already completed, skipping first boot setup.');
            return true;
        }
        this.logger.log('First boot setup in progress.');
        return false;
    }

    async onModuleInit() {
        const paths = getters.paths();

        this.activationDir = paths.activationBase;
        this.configFile = paths['dynamix-config']?.[1];
        this.caseModelCfg = paths.boot?.caseModelConfig;
        this.identCfg = paths.identConfig;

        this.logger.log('OnboardingService initialized with paths from store.');

        if (!this.configFile) {
            this.logger.error('User dynamix config path missing. Skipping activation setup.');
            return;
        }

        try {
            const resolvedActivationDir = await this.resolveActivationDir(this.activationDir);
            if (!resolvedActivationDir) {
                this.logger.log(
                    `Activation directory ${this.activationDir} not found. Skipping activation setup.`
                );
                return;
            }
            if (resolvedActivationDir !== this.activationDir) {
                this.logger.log(
                    `Activation directory fallback detected. Using ${resolvedActivationDir} (configured ${this.activationDir}).`
                );
                this.activationDir = resolvedActivationDir;
            }
            this.logger.log(`Activation directory found: ${this.activationDir}`);

            // Proceed with first boot check and activation data retrieval ONLY if dir exists
            const hasRunFirstBootSetup = await this.ensureFirstBootCompletion();
            if (hasRunFirstBootSetup) {
                this.logger.log('First boot setup previously completed, skipping customizations.');
                return;
            }

            this.activationData = await this.getActivationData(); // This now uses this.activationDir
            await this.applyActivationCustomizations(); // This uses this.activationData and paths
        } catch (error: unknown) {
            // Catch errors specifically from the activation setup logic post-path init
            if (
                error instanceof Error &&
                'code' in error &&
                error.code === 'ENOENT' &&
                'path' in error &&
                error.path === this.activationDir
            ) {
                // This case should be handled by the access check above, but keep for safety.
                this.logger.log('Activation directory check failed within setup logic.');
            } else {
                this.logger.error('Error during activation check/setup on init:', error);
            }
        }
    }

    private async resolveActivationDir(configuredDir: string): Promise<string | null> {
        const candidates = getActivationDirCandidates(configuredDir);
        for (const activationDir of candidates) {
            try {
                await fs.access(activationDir);
                return activationDir;
            } catch (dirError: unknown) {
                if (
                    !(dirError instanceof Error) ||
                    !('code' in dirError) ||
                    dirError.code !== 'ENOENT'
                ) {
                    throw dirError;
                }
            }
        }
        return null;
    }

    private async getActivationJsonPath(): Promise<string | null> {
        return findActivationCodeFile(this.activationDir, this.activationJsonExtension, this.logger);
    }

    public async getPublicPartnerInfo(): Promise<PublicPartnerInfo | null> {
        const override = this.onboardingOverrides.getState();

        // If partnerInfo is explicitly overridden, use it
        if (override?.partnerInfo !== undefined) {
            if (override.partnerInfo === null) {
                return null;
            }
            return this.buildPublicPartnerInfo(
                override.partnerInfo.partner,
                override.partnerInfo.branding
            );
        }

        // If activationCode is overridden, derive partnerInfo from it
        // This ensures edits to activationCode.branding are reflected in the UI
        if (override?.activationCode !== undefined) {
            if (override.activationCode === null) {
                return null;
            }
            return this.buildPublicPartnerInfo(
                override.activationCode.partner,
                override.activationCode.branding
            );
        }

        const activationData = await this.getActivationData();
        if (!activationData) {
            return null;
        }

        return this.buildPublicPartnerInfo(activationData.partner, activationData.branding);
    }

    public async getActivationDataForPublic(): Promise<ActivationCode | null> {
        const activationData = await this.getActivationData();
        if (!activationData) {
            return null;
        }

        const publicPartnerInfo = await this.buildPublicPartnerInfo(
            activationData.partner,
            activationData.branding
        );

        return plainToClass(ActivationCode, {
            ...activationData,
            partner: publicPartnerInfo.partner,
            branding: publicPartnerInfo.branding,
        });
    }

    private detectImageMime(buffer: Buffer): string {
        if (buffer.length >= 8) {
            if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
                return 'image/png';
            }

            if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
                return 'image/jpeg';
            }

            if (
                buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
                buffer.subarray(8, 12).toString('ascii') === 'WEBP'
            ) {
                return 'image/webp';
            }
        }

        if (buffer.length >= 6 && buffer.subarray(0, 6).toString('ascii') === 'GIF87a') {
            return 'image/gif';
        }

        if (buffer.length >= 6 && buffer.subarray(0, 6).toString('ascii') === 'GIF89a') {
            return 'image/gif';
        }

        const textChunk = buffer.subarray(0, 1024).toString('utf8').trimStart();
        if (textChunk.startsWith('<svg') || textChunk.startsWith('<?xml')) {
            return 'image/svg+xml';
        }

        return 'application/octet-stream';
    }

    private bufferToDataUri(payload: Buffer): string {
        const mime = this.detectImageMime(payload);
        return `data:${mime};base64,${payload.toString('base64')}`;
    }

    private async normalizePartnerLogoSourceForBrowser(
        source: string,
        label: 'light' | 'dark'
    ): Promise<string> {
        const normalizedSource = source.trim();
        if (!normalizedSource) {
            throw new Error('Image source is empty.');
        }

        if (this.looksLikeHttpUrl(normalizedSource)) {
            return normalizedSource;
        }

        const dataUriPayload = this.tryDecodeDataUri(normalizedSource);
        if (dataUriPayload) {
            this.assertImageSize(dataUriPayload);
            return this.bufferToDataUri(dataUriPayload);
        }

        const rawBase64Payload = this.tryDecodeRawBase64(normalizedSource);
        if (rawBase64Payload) {
            this.assertImageSize(rawBase64Payload);
            return this.bufferToDataUri(rawBase64Payload);
        }

        const localSourcePath = this.resolveLocalImagePath(normalizedSource);
        if (!(await fileExists(localSourcePath))) {
            throw new Error(`Local ${label} partner logo source not found: ${localSourcePath}`);
        }

        const payload = await fs.readFile(localSourcePath);
        this.assertImageSize(payload);
        return this.bufferToDataUri(payload);
    }

    private async buildPublicPartnerInfo(
        partner: PublicPartnerInfo['partner'],
        brandingInput: PublicPartnerInfo['branding']
    ): Promise<PublicPartnerInfo> {
        const branding = brandingInput ? { ...brandingInput } : {};

        if (branding.partnerLogoLightUrl?.trim()) {
            try {
                branding.partnerLogoLightUrl = await this.normalizePartnerLogoSourceForBrowser(
                    branding.partnerLogoLightUrl,
                    'light'
                );
            } catch (error: unknown) {
                branding.partnerLogoLightUrl = null;
                this.logger.warn(
                    `Failed to normalize light partner logo source: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        }

        if (branding.partnerLogoDarkUrl?.trim()) {
            try {
                branding.partnerLogoDarkUrl = await this.normalizePartnerLogoSourceForBrowser(
                    branding.partnerLogoDarkUrl,
                    'dark'
                );
            } catch (error: unknown) {
                branding.partnerLogoDarkUrl = null;
                this.logger.warn(
                    `Failed to normalize dark partner logo source: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        }

        const darkLogoUrl = branding.partnerLogoDarkUrl ?? null;
        const lightLogoUrl = branding.partnerLogoLightUrl ?? null;

        // If only one variant is provided, use it for both themes.
        branding.partnerLogoDarkUrl = darkLogoUrl ?? lightLogoUrl;
        branding.partnerLogoLightUrl = lightLogoUrl ?? darkLogoUrl;
        branding.hasPartnerLogo = Boolean(branding.partnerLogoDarkUrl || branding.partnerLogoLightUrl);

        return {
            partner,
            branding: plainToClass(BrandingConfig, branding),
        };
    }

    public async isPasswordSet(): Promise<boolean> {
        const paths = store.getState().paths;
        const hasPasswd = await fileExists(paths.passwd);
        return hasPasswd;
    }

    public async getOnboardingState(): Promise<OnboardingState> {
        const registrationState = this.onboardingState.getRegistrationState();
        const hasActivationCode = await this.onboardingState.hasActivationCode();
        const isFreshInstall = this.onboardingState.isFreshInstall(registrationState);
        const isRegistered = this.onboardingState.isRegistered(registrationState);
        const activationRequired =
            hasActivationCode && this.onboardingState.requiresActivationStep(registrationState);

        return {
            registrationState,
            isRegistered,
            isFreshInstall,
            hasActivationCode,
            activationRequired,
        };
    }

    public isFreshInstall(): boolean {
        return this.onboardingState.isFreshInstall();
    }

    /**
     * Get the activation data from the activation directory.
     * @returns The activation data or null if the file is not found or invalid.
     * @throws Error if the directory does not exist.
     */
    async getActivationData(): Promise<ActivationCode | null> {
        const override = this.onboardingOverrides.getState();
        if (override?.activationCode !== undefined) {
            return override.activationCode ?? null;
        }

        // Return cached data if available
        if (this.activationData) {
            this.logger.debug('Returning cached activation data.');
            return this.activationData;
        }

        this.logger.debug('Fetching activation data from disk...');
        const activationJsonPath = await this.getActivationJsonPath();

        if (!activationJsonPath) {
            this.logger.debug('No activation JSON file found.');
            return null;
        }
        this.activationJsonPath = activationJsonPath;

        try {
            const fileContent = await fs.readFile(activationJsonPath, 'utf-8');
            const activationDataRaw = JSON.parse(fileContent);

            const activationDataDto = plainToClass(ActivationCode, activationDataRaw);
            await validateOrReject(activationDataDto);

            // Cache the validated data
            this.activationData = activationDataDto;
            this.logger.debug('Activation data fetched and cached.');
            return this.activationData;
        } catch (error) {
            this.logger.error(`Error processing activation file ${activationJsonPath}:`, error);
            // Do not cache in case of error
            return null;
        }
    }

    public clearActivationDataCache(): void {
        this.activationData = null;
        this.activationJsonPath = null;
        this.materializedPartnerMedia = {
            banner: false,
            caseModel: false,
        };
    }

    async applyActivationCustomizations() {
        this.logger.log('Applying activation customizations if data is available...');

        if (!this.activationData) {
            this.logger.log('No valid activation data found. Skipping customizations.');
            return;
        }

        try {
            // Check if activation dir exists (redundant if onModuleInit succeeded, but safe)
            try {
                await fs.access(this.activationDir);
            } catch (dirError: unknown) {
                if (dirError instanceof Error && 'code' in dirError && dirError.code === 'ENOENT') {
                    this.logger.warn('Activation directory disappeared after init? Skipping.');
                    return;
                }
                throw dirError; // Rethrow other errors
            }

            this.logger.log(`Using validated activation data to apply customizations.`);

            await this.materializePartnerMediaAssets();
            await this.setupPartnerBanner();
            await this.applyDisplaySettings();
            await this.applyCaseModelConfig();

            this.logger.log('Activation setup complete.');
        } catch (error: unknown) {
            // Added type annotation
            // Initial dir check removed as it's handled in onModuleInit or the inner try block
            this.logger.error('Error during activation setup:', error);
        }
    }

    private async materializePartnerMediaAssets() {
        this.materializedPartnerMedia = {
            banner: false,
            caseModel: false,
        };
        if (!this.activationData?.branding) {
            return;
        }

        const paths = getters.paths();
        const mediaSources: Array<{
            key: 'banner' | 'caseModel';
            label: string;
            source?: string | null;
            targetPath: string;
        }> = [
            {
                key: 'banner',
                label: 'banner',
                source: this.activationData.branding.bannerImage,
                targetPath: paths.activation.banner,
            },
            {
                key: 'caseModel',
                label: 'case-model',
                source: this.activationData.branding.caseModelImage,
                targetPath: paths.activation.caseModel,
            },
        ];

        for (const media of mediaSources) {
            if (!media.source?.trim()) {
                continue;
            }

            try {
                await this.materializeImageAsset(media.source, media.targetPath);
                this.materializedPartnerMedia[media.key] = true;
                this.logger.log(`Materialized activation ${media.label} asset at ${media.targetPath}`);
            } catch (error: unknown) {
                this.materializedPartnerMedia[media.key] = false;
                await this.safeUnlink(media.targetPath);
                this.logger.warn(
                    `Failed to materialize activation ${media.label} asset: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
        }
    }

    private looksLikeHttpUrl(source: string): boolean {
        try {
            const parsed = new URL(source);
            return parsed.protocol === 'https:' || parsed.protocol === 'http:';
        } catch {
            return false;
        }
    }

    private tryDecodeDataUri(source: string): Buffer | null {
        if (!source.startsWith('data:')) {
            return null;
        }

        const separator = source.indexOf(',');
        if (separator < 0) {
            return null;
        }

        const meta = source.slice(5, separator);
        const payload = source.slice(separator + 1);
        const isBase64 = /;base64/i.test(meta);

        try {
            if (isBase64) {
                return Buffer.from(payload, 'base64');
            }
            return Buffer.from(decodeURIComponent(payload), 'utf8');
        } catch {
            return null;
        }
    }

    private tryDecodeRawBase64(source: string): Buffer | null {
        const normalized = source.replace(/\s+/g, '');
        if (normalized.length < 64 || normalized.length % 4 !== 0) {
            return null;
        }
        if (!/^[A-Za-z0-9+/=]+$/.test(normalized)) {
            return null;
        }

        try {
            const decoded = Buffer.from(normalized, 'base64');
            if (!decoded.length) {
                return null;
            }
            const normalizedInput = normalized.replace(/=+$/g, '');
            const normalizedDecoded = decoded.toString('base64').replace(/=+$/g, '');
            if (normalizedInput !== normalizedDecoded) {
                return null;
            }
            return decoded;
        } catch {
            return null;
        }
    }

    private resolveLocalImagePath(source: string): string {
        if (path.isAbsolute(source)) {
            return path.resolve(source);
        }

        const activationJsonDir = this.activationJsonPath
            ? path.dirname(this.activationJsonPath)
            : this.activationDir;
        return path.resolve(activationJsonDir, source);
    }

    private async safeUnlink(filePath: string) {
        try {
            await fs.unlink(filePath);
        } catch (error: unknown) {
            if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') {
                throw error;
            }
        }
    }

    private assertImageSize(buffer: Buffer) {
        if (!buffer.length) {
            throw new Error('Image source resolved to an empty payload.');
        }
        if (buffer.length > this.maxActivationImageBytes) {
            throw new Error(`Image payload exceeds max size (${this.maxActivationImageBytes} bytes).`);
        }
    }

    private async writeBinaryAsset(targetPath: string, payload: Buffer) {
        this.assertImageSize(payload);
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        await fs.writeFile(targetPath, payload);
    }

    private async replaceTargetWithSource(sourcePath: string, targetPath: string) {
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        const tempTarget = `${targetPath}.tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`;

        try {
            try {
                await fs.symlink(sourcePath, tempTarget);
            } catch {
                await fs.copyFile(sourcePath, tempTarget);
            }
            await fs.rename(tempTarget, targetPath);
        } finally {
            await this.safeUnlink(tempTarget);
        }
    }

    private async materializeImageAsset(source: string, targetPath: string) {
        const normalizedSource = source.trim();
        if (!normalizedSource) {
            throw new Error('Image source is empty.');
        }

        const dataUriPayload = this.tryDecodeDataUri(normalizedSource);
        if (dataUriPayload) {
            await this.writeBinaryAsset(targetPath, dataUriPayload);
            return;
        }

        if (this.looksLikeHttpUrl(normalizedSource)) {
            const response = await fetch(normalizedSource, {
                signal: AbortSignal.timeout(15_000),
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type')?.toLowerCase();
            if (contentType && !contentType.includes('image/') && !contentType.includes('svg')) {
                throw new Error(`Remote source is not an image (content-type: ${contentType})`);
            }

            const remotePayload = Buffer.from(await response.arrayBuffer());
            await this.writeBinaryAsset(targetPath, remotePayload);
            return;
        }

        const rawBase64Payload = this.tryDecodeRawBase64(normalizedSource);
        if (rawBase64Payload) {
            await this.writeBinaryAsset(targetPath, rawBase64Payload);
            return;
        }

        const localSourcePath = this.resolveLocalImagePath(normalizedSource);
        if (!(await fileExists(localSourcePath))) {
            throw new Error(`Local image source not found: ${localSourcePath}`);
        }

        const resolvedSource = path.resolve(localSourcePath);
        const resolvedTarget = path.resolve(targetPath);
        if (resolvedSource === resolvedTarget) {
            return;
        }

        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        await this.safeUnlink(targetPath);

        try {
            await fs.symlink(resolvedSource, targetPath);
        } catch {
            await fs.copyFile(resolvedSource, targetPath);
        }
    }

    private async setupPartnerBanner() {
        this.logger.log('Setting up partner banner...');
        if (!this.materializedPartnerMedia.banner) {
            this.logger.log(
                'No partner banner image configured in activation code, skipping banner setup.'
            );
            return;
        }
        const paths = getters.paths();
        const bannerSource = paths.activation.banner;
        const bannerTarget = paths.webgui.banner.fullPath;

        try {
            // Always overwrite if partner banner exists
            if (await fileExists(bannerSource)) {
                this.logger.log(`Partner banner found at ${bannerSource}, overwriting original.`);
                try {
                    await this.replaceTargetWithSource(bannerSource, bannerTarget);
                    this.logger.log('Partner banner copied over the original banner.');
                } catch (copyError: unknown) {
                    this.logger.warn(
                        `Failed to replace the original banner with the partner banner: ${copyError instanceof Error ? copyError.message : 'Unknown error'}`
                    );
                }
            } else {
                this.logger.log('Partner banner file not found, skipping banner setup.');
            }
        } catch (error) {
            this.logger.error('Error setting up partner banner:', error);
        }
    }

    private async applyDisplaySettings() {
        if (!this.activationData) {
            this.logger.warn('No activation data available for display settings.');
            return;
        }

        this.logger.log('Applying display settings...');
        const currentDisplaySettings = getters.dynamix()?.display || {};
        this.logger.debug('Current display settings from store:', currentDisplaySettings);

        const existingDisplaySettings = Object.entries(currentDisplaySettings).reduce<
            Record<string, string>
        >((accumulator, [key, value]) => {
            if (typeof value === 'string') {
                accumulator[key] = value;
            }
            return accumulator;
        }, {});

        const settingsToUpdate: Record<string, string> = {};

        // Map activation data properties to their corresponding config keys
        type DisplayMapping = {
            key: string;
            transform?: (v: unknown) => string;
            skipIfEmpty?: boolean;
        };

        const displayMappings: Record<string, DisplayMapping> = {
            header: {
                key: 'header',
                transform: (v: unknown) => (typeof v === 'string' ? v.replace('#', '') : ''),
                skipIfEmpty: true,
            },
            headermetacolor: {
                key: 'headermetacolor',
                transform: (v: unknown) => (typeof v === 'string' ? v.replace('#', '') : ''),
                skipIfEmpty: true,
            },
            background: {
                key: 'background',
                transform: (v: unknown) => (typeof v === 'string' ? v.replace('#', '') : ''),
                skipIfEmpty: true,
            },
            showBannerGradient: {
                key: 'showBannerGradient',
                transform: (v: unknown) => (v === true ? 'yes' : 'no'),
            },
        };

        // Apply mappings
        const brandingConfig = this.activationData.branding || {};

        Object.entries(displayMappings).forEach(([prop, mapping]) => {
            const value = brandingConfig[prop as keyof typeof brandingConfig];
            if (value !== undefined && value !== null) {
                const transformedValue = mapping.transform ? mapping.transform(value) : value;
                if (!mapping.skipIfEmpty || transformedValue) {
                    settingsToUpdate[mapping.key] = transformedValue as string; // Ensure string type for record
                }
            }
        });

        // Only set banner='image' if the banner file actually exists in the webgui images directory
        // This assumes setupPartnerBanner has already attempted to copy it if necessary.
        const paths = getters.paths();
        const bannerSource = paths.activation.banner;

        if (this.materializedPartnerMedia.banner && (await fileExists(bannerSource))) {
            settingsToUpdate['banner'] = 'image';
            this.logger.debug(`Webgui banner exists at ${bannerSource}, setting banner=image.`);
        } else {
            this.logger.debug(
                `Webgui banner does not exist at ${bannerSource}, skipping banner=image setting.`
            );
        }

        if (Object.keys(settingsToUpdate).length === 0) {
            this.logger.log(
                'No new display settings found in activation data or derived from banner state.'
            );
            return;
        }

        this.logger.log('Updating display settings:', settingsToUpdate);

        try {
            await this.updateCfgFile(this.configFile, 'display', {
                ...existingDisplaySettings,
                ...settingsToUpdate,
            });
            this.logger.log('Display settings updated in config file.');
        } catch (error) {
            this.logger.error('Error applying display settings:', error);
        }
    }

    private async applyCaseModelConfig() {
        if (!this.activationData) {
            this.logger.warn('No activation data available for case model setup.');
            return;
        }
        if (!this.materializedPartnerMedia.caseModel) {
            this.logger.log(
                'No partner case-model image configured in activation code, skipping case model setup.'
            );
            return;
        }
        if (!this.caseModelCfg) {
            this.logger.warn('Case model config path missing. Skipping case model setup.');
            return;
        }

        this.logger.log('Applying case model...');
        const paths = getters.paths();
        const caseModelSource = paths.activation.caseModel;

        try {
            if (await fileExists(caseModelSource)) {
                this.logger.log('Case model found in activation assets, applying...');
                const modelToSet = path.basename(paths.webgui.caseModel.fullPath); // e.g., 'case-model.png'
                await this.replaceTargetWithSource(caseModelSource, paths.webgui.caseModel.fullPath);
                await fs.mkdir(path.dirname(this.caseModelCfg), { recursive: true });
                await fs.writeFile(this.caseModelCfg, modelToSet);
                this.logger.log(`Case model set to ${modelToSet} in ${this.caseModelCfg}`);
            } else {
                this.logger.log('No custom case model file found in activation assets.');
            }
        } catch (error) {
            this.logger.error('Error applying case model:', error);
        }
    }

    private async applyServerIdentity() {
        if (!this.activationData) {
            this.logger.warn('No activation data available for server identity setup.');
            return;
        }

        this.logger.log('Applying server identity...');
        // Ideally, get current values from Redux store instead of var.ini
        // Assuming EmhttpState type provides structure for emhttp slice. Adjust if necessary.
        // Using optional chaining ?. in case emhttp or var is not defined in the state yet.
        const currentEmhttpState = getters.emhttp();
        const currentName = currentEmhttpState?.var?.name || '';
        // Skip sending sysModel to emcmd for now
        const currentSysModel = '';
        const currentComment = currentEmhttpState?.var?.comment || '';

        this.logger.debug(
            `Current identity - Name: ${currentName}, Model: ${currentSysModel}, Comment: ${currentComment}`
        );

        const { serverName, model: sysModel, comment } = this.activationData.system || {};
        const paramsToUpdate: Record<string, string> = {
            ...(serverName && { NAME: serverName }),
            ...(sysModel && { SYS_MODEL: sysModel }),
            ...(comment !== undefined && { COMMENT: comment }),
        };

        if (Object.keys(paramsToUpdate).length === 0) {
            this.logger.log('No server identity information found in activation data.');
            return;
        }

        this.logger.log('Updating server identity:', paramsToUpdate);

        try {
            // Trigger emhttp update via emcmd
            const updateParams = {
                ...paramsToUpdate,
                changeNames: 'Apply',
                // Can be null string
                server_name: '',
                // Can be null string
                server_addr: '',
            };
            this.logger.log(`Calling emcmd with params: %o`, updateParams);
            await emcmd(updateParams, { waitForToken: true });

            this.logger.log('emcmd executed successfully.');
        } catch (error: unknown) {
            this.logger.error('Error applying server identity: %o', error);
        }
    }

    // Helper function to update .cfg files (like dynamix.cfg or ident.cfg) using the ini library
    private async updateCfgFile(
        filePath: string,
        section: string | null,
        updates: Record<string, string>
    ) {
        let configData: Record<string, Record<string, string> | string> = {};
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            // Parse the INI file content. Note: ini library parses values as strings by default.
            // It might interpret numbers/booleans if not quoted, but our values are always quoted.
            configData = ini.parse(content) as Record<string, Record<string, string> | string>;
        } catch (error: unknown) {
            if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
                this.logger.log(`Config file ${filePath} not found, will create it.`);
                // Initialize configData as an empty object if file doesn't exist
            } else {
                this.logger.error(`Error reading config file ${filePath}:`, error);
                throw error; // Re-throw other errors
            }
        }

        if (section) {
            if (!configData[section] || typeof configData[section] === 'string') {
                configData[section] = {};
            }
            Object.entries(updates).forEach(([key, value]) => {
                (configData[section] as Record<string, string>)[key] = value;
            });
        } else {
            Object.entries(updates).forEach(([key, value]) => {
                configData[key] = value;
            });
        }

        try {
            const hasTopLevelScalarValues = Object.values(configData).some(
                (value) => value === null || typeof value !== 'object' || Array.isArray(value)
            );
            const newContent = hasTopLevelScalarValues
                ? ini.stringify(configData)
                : safelySerializeObjectToIni(configData);

            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, newContent + '\n');
            this.logger.log(`Config file ${filePath} updated successfully.`);
        } catch (error: unknown) {
            this.logger.error(`Error writing config file ${filePath}:`, error);
            throw error;
        }
    }

    private addHashtoHexField(field: string | undefined): string | undefined {
        return field ? `#${field}` : undefined;
    }

    public async getTheme(): Promise<Theme> {
        if (!getters.dynamix()?.display?.theme) {
            throw new GraphQLError('No theme found or loaded from dynamix.cfg settings.');
        }

        const name =
            ThemeName[getters.dynamix()!.display!.theme.toLowerCase() as keyof typeof ThemeName] ??
            ThemeName.white;

        const banner = getters.dynamix()!.display!.banner;
        const bannerGradient = getters.dynamix()!.display!.showBannerGradient;
        const bgColor = getters.dynamix()!.display!.background;
        const descriptionShow = getters.dynamix()!.display!.headerdescription;
        const metaColor = getters.dynamix()!.display!.headermetacolor;
        const textColor = getters.dynamix()!.display!.header;

        return {
            name,
            showBannerImage: banner === 'image' || banner === 'yes',
            showBannerGradient: bannerGradient === 'yes',
            headerBackgroundColor: this.addHashtoHexField(bgColor),
            headerPrimaryTextColor: this.addHashtoHexField(textColor),
            headerSecondaryTextColor: this.addHashtoHexField(metaColor),
            showHeaderDescription: descriptionShow === 'yes',
        };
    }

    public async setTheme(theme: ThemeName): Promise<Theme> {
        this.logger.log(`Updating theme to ${theme}`);
        await this.updateCfgFile(this.configFile, 'display', { theme });

        // Refresh in-memory store so subsequent reads get the new theme without a restart
        const paths = getters.paths();
        const updatedConfig = loadDynamixConfigFromDiskSync(paths['dynamix-config']);
        store.dispatch(updateDynamixConfig(updatedConfig));

        return this.getTheme();
    }
}
