import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

import { plainToClass } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import * as ini from 'ini';

import { emcmd } from '@app/core/utils/clients/emcmd.js';
import { fileExists } from '@app/core/utils/files/file-exists.js';
import { sleep } from '@app/core/utils/misc/sleep.js';
import { reloadNginxAndUpdateDNS } from '@app/store/actions/reload-nginx-and-update-dns.js';
import { getters, store } from '@app/store/index.js';
import { ActivationCode } from '@app/unraid-api/graph/resolvers/customization/activation-code.model.js';
import { convertWebGuiPathToAssetPath } from '@app/utils.js';

@Injectable()
export class CustomizationService implements OnModuleInit {
    private readonly logger = new Logger(CustomizationService.name);
    private readonly activationJsonExtension = '.activationcode';
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
        // Dynamically import getters and initialize paths
        const paths = getters.paths();

        this.activationDir = paths.activationBase;
        this.hasRunFirstBootSetup = path.join(this.activationDir, '.done');
        this.configFile = paths['dynamix-config']?.[1];
        if (!this.configFile) {
            this.logger.error(
                "Could not resolve user dynamix config path (paths['dynamix-config'][1]) from store."
            );
            // Handle error appropriately - maybe throw, or use a default?
            // For now, we'll let subsequent operations fail if configFile is needed.
            return; // Stop initialization if critical path is missing
        }
        this.caseModelCfg = paths.dynamixCaseModelConfig;
        this.identCfg = paths.identConfig;

        this.logger.log('CustomizationService initialized with paths from store.');

        try {
            // Check if activation dir exists using the initialized path
            try {
                await fs.access(this.activationDir);
                this.logger.log(`Activation directory found: ${this.activationDir}`);
            } catch (dirError: any) {
                if (dirError.code === 'ENOENT') {
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
        } catch (error: any) {
            // Catch errors specifically from the activation setup logic post-path init
            if (error.code === 'ENOENT' && error.path === this.activationDir) {
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
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                this.logger.warn(
                    `Activation directory ${this.activationDir} not found when searching for JSON file.`
                );
            } else {
                this.logger.error('Error accessing activation directory or reading its content.', error);
            }
            return null;
        }
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
            this.logger.warn('No activation JSON file found.');
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

    public async getCaseIconWebguiPath(): Promise<string | null> {
        const paths = getters.paths();
        if (await fileExists(paths.caseModelSource)) {
            return convertWebGuiPathToAssetPath(paths.caseModelTarget);
        }
        return null;
    }

    public async getPartnerLogoWebguiPath(): Promise<string | null> {
        const paths = getters.paths();
        if (await fileExists(paths.partnerLogoSource)) {
            return convertWebGuiPathToAssetPath(paths.partnerLogoTarget);
        }
        return null;
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
            } catch (dirError: any) {
                if (dirError.code === 'ENOENT') {
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
        } catch (error: any) {
            // Added type annotation
            // Initial dir check removed as it's handled in onModuleInit or the inner try block
            this.logger.error('Error during activation setup:', error);
        }
    }

    private async setupPartnerBanner() {
        this.logger.log('Setting up partner banner...');
        const paths = getters.paths();
        const partnerBannerSource = paths.partnerBannerSource;
        const partnerBannerTarget = paths.partnerBannerTarget;

        try {
            // Always overwrite if partner banner exists
            if (await fileExists(partnerBannerSource)) {
                this.logger.log(`Partner banner found at ${partnerBannerSource}, overwriting original.`);
                try {
                    await fs.copyFile(partnerBannerSource, partnerBannerTarget);
                    this.logger.log('Partner banner copied over the original banner.');
                } catch (copyError: any) {
                    this.logger.warn(
                        `Failed to replace the original banner with the partner banner: ${copyError.message}`
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
            transform?: (v: any) => string;
            skipIfEmpty?: boolean;
        };

        const displayMappings: Record<string, DisplayMapping> = {
            header: { key: 'header', transform: (v: string) => v.replace('#', ''), skipIfEmpty: true },
            headermetacolor: {
                key: 'headermetacolor',
                transform: (v: string) => v.replace('#', ''),
                skipIfEmpty: true,
            },
            background: {
                key: 'background',
                transform: (v: string) => v.replace('#', ''),
                skipIfEmpty: true,
            },
            showBannerGradient: {
                key: 'showBannerGradient',
                transform: (v: boolean) => (v ? 'yes' : 'no'),
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
        const partnerBannerSource = paths.partnerBannerSource;

        if (await fileExists(partnerBannerSource)) {
            settingsToUpdate['banner'] = 'image';
            this.logger.debug(`Webgui banner exists at ${partnerBannerSource}, setting banner=image.`);
        } else {
            this.logger.debug(
                `Webgui banner does not exist at ${partnerBannerSource}, skipping banner=image setting.`
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
        const caseModelSource = paths.caseModelSource;

        try {
            let currentCaseModel = '';
            try {
                currentCaseModel = await fs.readFile(this.caseModelCfg, 'utf-8');
            } catch (readError: any) {
                // Added type annotation
                if (readError.code !== 'ENOENT') throw readError; // Rethrow if not a file not found error
                this.logger.log(`${this.caseModelCfg} not found, assuming no case model set.`);
            }

            this.logger.debug(`Current case model: ${currentCaseModel}`);

            let modelToSet: string | null = null;

            // Check if the custom image file exists in assets
            if (await fileExists(caseModelSource)) {
                // Use the *target* filename which CaseModelCopierModification will create
                modelToSet = path.basename(paths.caseModelTarget); // e.g., 'case-model.png'
                this.logger.log('Custom case model file found in assets, config will be set.');
            } else {
                this.logger.log('No custom case model file found in assets.');
            }

            // If a model was determined, write it to the config file
            if (modelToSet) {
                try {
                    await fs.writeFile(this.caseModelCfg, modelToSet);
                    this.logger.log(`Case model set to ${modelToSet} in ${this.caseModelCfg}`);
                } catch (writeError: any) {
                    // Added type annotation
                    this.logger.error(`Failed to write case model config: ${writeError.message}`);
                }
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
        const currentSysModel = currentEmhttpState?.var?.sysModel || '';
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
            // Update ident.cfg first
            await this.updateCfgFile(this.identCfg, null, paramsToUpdate);
            this.logger.log(`Server identity updated in ${this.identCfg}`);

            // Trigger emhttp update via emcmd
            const updateParams = { ...paramsToUpdate, changeNames: 'Apply' };
            this.logger.log(`Calling emcmd with params: %o`, updateParams);

            await sleep(10000);
            await emcmd(updateParams);

            this.logger.log('emcmd executed successfully.');

            await store.dispatch(reloadNginxAndUpdateDNS());
            this.logger.log('Nginx reloaded and DNS updated successfully.');
        } catch (error) {
            this.logger.error('Error applying server identity: %o', error);
        }
    }

    // Helper function to update .cfg files (like dynamix.cfg or ident.cfg) using the ini library
    private async updateCfgFile(
        filePath: string,
        section: string | null,
        updates: Record<string, string>
    ) {
        let configData: any = {}; // Use 'any' for flexibility with ini structure
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            // Parse the INI file content. Note: ini library parses values as strings by default.
            // It might interpret numbers/booleans if not quoted, but our values are always quoted.
            configData = ini.parse(content);
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                this.logger.log(`Config file ${filePath} not found, will create it.`);
                // Initialize configData as an empty object if file doesn't exist
            } else {
                this.logger.error(`Error reading config file ${filePath}:`, error);
                throw error; // Re-throw other errors
            }
        }

        if (section) {
            // Ensure the section exists
            if (!configData[section]) {
                configData[section] = {};
            }
            // Update keys within the specified section using Object.entries
            Object.entries(updates).forEach(([key, value]) => {
                // ini.stringify will handle quoting, so just assign the string value
                configData[section][key] = value;
            });
        } else {
            // Update keys at the root level (for files like ident.cfg) using Object.entries
            Object.entries(updates).forEach(([key, value]) => {
                configData[key] = value;
            });
        }

        try {
            // Stringify the updated object back into INI format.
            // The 'ini' library defaults to section/key=value format, but options exist if needed.
            // It will automatically add quotes around values containing special characters,
            // but might not quote simple strings - however, Unraid's parser seems fine with this.
            // If strict KEY="value" quoting is absolutely required, manual formatting might be needed again.
            const newContent = ini.stringify(configData);

            // Write the updated content back to the file
            await fs.writeFile(filePath, newContent + '\n'); // Ensure trailing newline
            this.logger.log(`Config file ${filePath} updated successfully.`);
        } catch (error) {
            this.logger.error(`Error writing config file ${filePath}:`, error);
            throw error; // Re-throw write errors
        }
    }
}
