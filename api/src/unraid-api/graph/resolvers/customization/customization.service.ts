import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

import { plainToClass } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { GraphQLError } from 'graphql';
import * as ini from 'ini';

import { emcmd } from '@app/core/utils/clients/emcmd.js';
import { fileExists } from '@app/core/utils/files/file-exists.js';
import { getters, store } from '@app/store/index.js';
import {
    ActivationCode,
    PublicPartnerInfo,
} from '@app/unraid-api/graph/resolvers/customization/activation-code.model.js';
import { Theme, ThemeName } from '@app/unraid-api/graph/resolvers/customization/theme.model.js';

@Injectable()
export class CustomizationService implements OnModuleInit {
    private readonly logger = new Logger(CustomizationService.name);
    private readonly activationJsonExtension = '.activationcode';
    private readonly activationAppliedFilename = 'applied.txt';
    private activationDir!: string;
    private hasRunFirstBootSetup!: string;
    private configFile!: string;
    private caseModelCfg!: string;
    private identCfg!: string;

    private activationData: ActivationCode | null = null;

    async createOrGetFirstBootSetupFlag(): Promise<boolean> {
        await fs.mkdir(this.activationDir, { recursive: true });
        if (await fileExists(this.hasRunFirstBootSetup)) {
            this.logger.log('First boot setup flag file already exists.');
            return true; // Indicate setup was already done based on flag presence
        }
        await fs.writeFile(this.hasRunFirstBootSetup, 'true');
        this.logger.log('First boot setup flag file created.');
        return false; // Indicate setup was just marked as done
    }

    async onModuleInit() {
        const paths = getters.paths();

        this.activationDir = paths.activationBase;
        this.hasRunFirstBootSetup = path.join(this.activationDir, this.activationAppliedFilename);
        this.configFile = paths['dynamix-config']?.[1];
        this.identCfg = paths.identConfig;

        this.logger.log('CustomizationService initialized with paths from store.');

        try {
            // Check if activation dir exists using the initialized path
            try {
                await fs.access(this.activationDir);
                this.logger.log(`Activation directory found: ${this.activationDir}`);
            } catch (dirError: unknown) {
                if (dirError instanceof Error && 'code' in dirError && dirError.code === 'ENOENT') {
                    this.logger.log(
                        `Activation directory ${this.activationDir} not found. Skipping activation setup.`
                    );
                    return; // Exit if activation dir doesn't exist
                }
                throw dirError; // Rethrow other access errors
            }

            // Proceed with first boot check and activation data retrieval ONLY if dir exists
            const hasRunFirstBootSetup = await this.createOrGetFirstBootSetupFlag();
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

    private async getActivationJsonPath(): Promise<string | null> {
        try {
            // Check if dir exists first (using the initialized path)
            await fs.access(this.activationDir);

            const files = await fs.readdir(this.activationDir);
            const jsonFile = files.find((file) => file.endsWith(this.activationJsonExtension));
            return jsonFile ? path.join(this.activationDir, jsonFile) : null;
        } catch (error: unknown) {
            if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
                this.logger.debug(
                    `Activation directory ${this.activationDir} not found when searching for JSON file.`
                );
            } else {
                this.logger.error('Error accessing activation directory or reading its content.', error);
            }
            return null;
        }
    }

    public async getPublicPartnerInfo(): Promise<PublicPartnerInfo | null> {
        const activationData = await this.getActivationData();
        const paths = getters.paths();
        return {
            hasPartnerLogo: await fileExists(paths.activation.logo),
            partnerName: activationData?.partnerName,
            partnerUrl: activationData?.partnerUrl,
            partnerLogoUrl: paths.webgui.logo.assetPath,
        };
    }

    public async isPasswordSet(): Promise<boolean> {
        const paths = store.getState().paths;
        const hasPasswd = await fileExists(paths.passwd);
        return hasPasswd;
    }

    /**
     * Get the activation data from the activation directory.
     * @returns The activation data or null if the file is not found or invalid.
     * @throws Error if the directory does not exist.
     */
    async getActivationData(): Promise<ActivationCode | null> {
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

            await this.setupPartnerBanner();
            await this.applyDisplaySettings();
            await this.applyCaseModelConfig();
            await this.applyServerIdentity();

            this.logger.log('Activation setup complete.');
        } catch (error: unknown) {
            // Added type annotation
            // Initial dir check removed as it's handled in onModuleInit or the inner try block
            this.logger.error('Error during activation setup:', error);
        }
    }

    private async setupPartnerBanner() {
        this.logger.log('Setting up partner banner...');
        const paths = getters.paths();
        const bannerSource = paths.activation.banner;
        const bannerTarget = paths.webgui.banner.fullPath;

        try {
            // Always overwrite if partner banner exists
            if (await fileExists(bannerSource)) {
                this.logger.log(`Partner banner found at ${bannerSource}, overwriting original.`);
                try {
                    await fs.copyFile(bannerSource, bannerTarget);
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
            theme: { key: 'theme' },
        };

        // Apply mappings
        Object.entries(displayMappings).forEach(([prop, mapping]) => {
            const value = this.activationData?.[prop];
            if (value !== undefined && value !== null) {
                const transformedValue = mapping.transform ? mapping.transform(value) : value;
                if (!mapping.skipIfEmpty || transformedValue) {
                    settingsToUpdate[mapping.key] = transformedValue;
                }
            }
        });

        // Only set banner='image' if the banner file actually exists in the webgui images directory
        // This assumes setupPartnerBanner has already attempted to copy it if necessary.
        const paths = getters.paths();
        const bannerSource = paths.activation.banner;

        if (await fileExists(bannerSource)) {
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
            await this.updateCfgFile(this.configFile, 'display', settingsToUpdate);
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

        this.logger.log('Applying case model...');
        const paths = getters.paths();
        const caseModelSource = paths.activation.caseModel;

        try {
            if (await fileExists(caseModelSource)) {
                this.logger.log('Case model found in activation assets, applying...');
                const modelToSet = path.basename(paths.webgui.caseModel.fullPath); // e.g., 'case-model.png'
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

        const { serverName, sysModel, comment } = this.activationData;
        const paramsToUpdate: Record<string, string> = {
            ...(serverName && { NAME: serverName }),
            ...(sysModel && { SYS_MODEL: sysModel }),
            ...(comment && { COMMENT: comment }),
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
            const newContent = ini.stringify(configData);

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
            showBannerImage: banner === 'yes',
            showBannerGradient: bannerGradient === 'yes',
            headerBackgroundColor: this.addHashtoHexField(bgColor),
            headerPrimaryTextColor: this.addHashtoHexField(textColor),
            headerSecondaryTextColor: this.addHashtoHexField(metaColor),
            showHeaderDescription: descriptionShow === 'yes',
        };
    }
}
