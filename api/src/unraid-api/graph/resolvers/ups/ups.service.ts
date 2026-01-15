import { Injectable, Logger } from '@nestjs/common';
import { readFile, writeFile } from 'fs/promises';

import { execa } from 'execa';
import { z } from 'zod';

import { fileExists } from '@app/core/utils/files/file-exists.js';
import { UPSConfigInput } from '@app/unraid-api/graph/resolvers/ups/ups.inputs.js';

const UPSSchema = z.object({
    MODEL: z.string().optional(),
    STATUS: z.string().optional(),
    BCHARGE: z.string().optional(),
    TIMELEFT: z.string().optional(),
    LINEV: z.string().optional(),
    OUTPUTV: z.string().optional(),
    LOADPCT: z.string().optional(),
    NOMPOWER: z.string().optional(),
});

export type UPSData = z.infer<typeof UPSSchema>;

const UPSConfigSchema = z.object({
    SERVICE: z.string().optional(),
    UPSCABLE: z.string().optional(),
    CUSTOMUPSCABLE: z.string().optional(),
    UPSTYPE: z.string().optional(),
    DEVICE: z.string().optional(),
    OVERRIDE_UPS_CAPACITY: z.number().optional(),
    BATTERYLEVEL: z.number().optional(),
    MINUTES: z.number().optional(),
    TIMEOUT: z.number().optional(),
    KILLUPS: z.string().optional(),
    NISIP: z.string().optional(),
    NETSERVER: z.string().optional(),
    UPSNAME: z.string().optional(),
    MODELNAME: z.string().optional(),
});

export type UPSConfig = z.infer<typeof UPSConfigSchema>;

@Injectable()
export class UPSService {
    private readonly logger = new Logger(UPSService.name);
    private readonly configPath = '/etc/apcupsd/apcupsd.conf';
    private rc6Path = '/etc/rc.d/rc.6'; // Made non-readonly for testing

    async getUPSData(): Promise<UPSData> {
        try {
            const { stdout } = await execa('/sbin/apcaccess', [], {
                timeout: 10000,
                reject: false, // Handle errors manually
            });
            if (!stdout || stdout.trim().length === 0) {
                throw new Error('No UPS data returned from apcaccess');
            }
            const parsedData = this.parseUPSData(stdout);
            return UPSSchema.parse(parsedData);
        } catch (error) {
            this.logger.error('Error getting UPS data:', error);
            throw new Error(
                `Failed to get UPS data: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    async configureUPS(config: UPSConfigInput): Promise<void> {
        try {
            const currentConfig = await this.getCurrentConfig();
            const mergedConfig = this.mergeConfigurations(config, currentConfig);

            this.validateConfiguration(mergedConfig);

            await this.stopUPSService();

            const newConfig = this.prepareConfigObject(mergedConfig, currentConfig);

            await this.writeConfigurationWithBackup(newConfig, currentConfig);

            await this.configureKillPower(mergedConfig);

            if (mergedConfig.service === 'enable') {
                await this.startUPSService();
            }
        } catch (error) {
            this.logger.error('Error configuring UPS:', error);
            throw new Error(
                `Failed to configure UPS: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    private mergeConfigurations(config: UPSConfigInput, currentConfig: UPSConfig) {
        return {
            service: config.service ?? currentConfig.SERVICE ?? 'disable',
            upsCable: config.upsCable ?? currentConfig.UPSCABLE ?? 'usb',
            customUpsCable: config.customUpsCable ?? currentConfig.CUSTOMUPSCABLE,
            upsType: config.upsType ?? currentConfig.UPSTYPE ?? 'usb',
            device: config.device ?? currentConfig.DEVICE ?? '',
            overrideUpsCapacity: config.overrideUpsCapacity ?? currentConfig.OVERRIDE_UPS_CAPACITY,
            batteryLevel: config.batteryLevel ?? currentConfig.BATTERYLEVEL ?? 10,
            minutes: config.minutes ?? currentConfig.MINUTES ?? 5,
            timeout: config.timeout ?? currentConfig.TIMEOUT ?? 0,
            killUps: config.killUps ?? currentConfig.KILLUPS ?? 'no',
        };
    }

    private validateConfiguration(config: ReturnType<typeof this.mergeConfigurations>): void {
        if (!config.upsType) {
            throw new Error('upsType is required');
        }
        if (!config.device && config.upsType !== 'usb') {
            throw new Error('device is required for non-USB UPS types');
        }
    }

    private async stopUPSService(): Promise<void> {
        try {
            await execa('/etc/rc.d/rc.apcupsd', ['stop'], { timeout: 10000 });
        } catch (error) {
            this.logger.warn('Failed to stop apcupsd service (may not be running):', error);
        }
    }

    private async startUPSService(): Promise<void> {
        try {
            await execa('/etc/rc.d/rc.apcupsd', ['start'], { timeout: 10000 });
            this.logger.debug('Successfully started apcupsd service');
        } catch (error) {
            this.logger.error('Failed to start apcupsd service:', error);
            throw new Error(
                `Configuration written successfully, but failed to start service: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    private prepareConfigObject(
        mergedConfig: ReturnType<typeof this.mergeConfigurations>,
        currentConfig: UPSConfig
    ): Partial<UPSConfig> {
        const cable =
            mergedConfig.upsCable === 'custom' ? mergedConfig.customUpsCable : mergedConfig.upsCable;

        const newConfig: Partial<UPSConfig> = {
            NISIP: currentConfig.NISIP || '0.0.0.0',
            SERVICE: mergedConfig.service,
            UPSTYPE: mergedConfig.upsType,
            DEVICE: mergedConfig.device || '',
            BATTERYLEVEL: mergedConfig.batteryLevel,
            MINUTES: mergedConfig.minutes,
            TIMEOUT: mergedConfig.timeout,
            UPSCABLE: cable,
            KILLUPS: mergedConfig.killUps,
            NETSERVER: currentConfig.NETSERVER,
            UPSNAME: currentConfig.UPSNAME,
            MODELNAME: currentConfig.MODELNAME,
        };

        if (
            mergedConfig.overrideUpsCapacity !== undefined &&
            mergedConfig.overrideUpsCapacity !== null
        ) {
            newConfig.OVERRIDE_UPS_CAPACITY = mergedConfig.overrideUpsCapacity;
        }

        return newConfig;
    }

    private async writeConfigurationWithBackup(
        newConfig: Partial<UPSConfig>,
        currentConfig: UPSConfig
    ): Promise<void> {
        const backupPath = `${this.configPath}.backup`;

        await this.createBackup(backupPath);

        const configContent = this.generateApcupsdConfig(newConfig, currentConfig);

        try {
            await writeFile(this.configPath, configContent, 'utf-8');
            this.logger.debug('Successfully wrote new UPS configuration');
        } catch (error) {
            await this.restoreBackup(backupPath);
            throw error;
        }
    }

    private async createBackup(backupPath: string): Promise<void> {
        try {
            if (await fileExists(this.configPath)) {
                const currentContent = await readFile(this.configPath, 'utf-8');
                await writeFile(backupPath, currentContent, 'utf-8');
                this.logger.debug(`Backed up current config to ${backupPath}`);
            }
        } catch (error) {
            this.logger.warn('Failed to create config backup:', error);
        }
    }

    private async restoreBackup(backupPath: string): Promise<void> {
        try {
            if (await fileExists(backupPath)) {
                const backupContent = await readFile(backupPath, 'utf-8');
                await writeFile(this.configPath, backupContent, 'utf-8');
                this.logger.warn('Restored config from backup after write failure');
            }
        } catch (restoreError) {
            this.logger.error('Failed to restore config backup:', restoreError);
        }
    }

    private async configureKillPower(
        config: ReturnType<typeof this.mergeConfigurations>
    ): Promise<void> {
        // Only configure killpower if service is enabled
        if (config.service !== 'enable') {
            this.logger.debug('Skipping killpower configuration: service is not enabled');
            return;
        }

        const shouldEnableKillPower = config.killUps === 'yes';

        try {
            await this.modifyRc6File(shouldEnableKillPower);
        } catch (error) {
            // If file doesn't exist, just skip (e.g., in tests)
            if (error instanceof Error && error.message.includes('not found')) {
                this.logger.debug(`Skipping killpower configuration: ${this.rc6Path} not found`);
                return;
            }
            throw error;
        }
    }

    private async modifyRc6File(enableKillPower: boolean): Promise<void> {
        const content = await this.readFileIfExists(this.rc6Path);
        if (!content) {
            throw new Error(`${this.rc6Path} not found`);
        }

        const killPowerCommand = '/etc/apcupsd/apccontrol killpower; /sbin/poweroff';
        const normalPoweroff = '/sbin/poweroff';
        const hasKillPower = content.includes('apccontrol killpower');

        // Check if modification is needed
        if (enableKillPower && hasKillPower) {
            this.logger.debug('Killpower already enabled in rc.6');
            return;
        }
        if (!enableKillPower && !hasKillPower) {
            this.logger.debug('Killpower already disabled in rc.6');
            return;
        }

        // Modify content
        const modifiedContent = enableKillPower
            ? content.replace(normalPoweroff, killPowerCommand)
            : content.replace(killPowerCommand, normalPoweroff);

        // Write the modified content
        try {
            await writeFile(this.rc6Path, modifiedContent, 'utf-8');
            this.logger.debug(
                enableKillPower ? 'Added killpower to rc.6' : 'Removed killpower from rc.6'
            );
        } catch (error) {
            const action = enableKillPower ? 'enable' : 'disable';
            this.logger.error(`Failed to update rc.6 for killpower ${action}:`, error);
            throw new Error(
                `Failed to ${action} killpower in ${this.rc6Path}: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    private async readFileIfExists(path: string): Promise<string | null> {
        try {
            return await readFile(path, 'utf-8');
        } catch (error) {
            // File doesn't exist or can't be read
            return null;
        }
    }

    private parseUPSData(data: string): any {
        return data
            .split('\n')
            .map((line) => line.split(': '))
            .filter((parts) => parts.length === 2 && parts[0] && parts[1])
            .reduce(
                (upsData, [key, value]) => {
                    upsData[key.trim()] = value.trim();
                    return upsData;
                },
                {} as Record<string, string>
            );
    }

    async getCurrentConfig(): Promise<UPSConfig> {
        try {
            const configContent = await this.readFileIfExists(this.configPath);
            if (!configContent) {
                this.logger.warn(`UPS config file not found at ${this.configPath}`);
                return {};
            }

            const config = this.parseApcupsdConfig(configContent);
            return UPSConfigSchema.parse(config);
        } catch (error) {
            this.logger.error('Error reading UPS config:', error);
            throw new Error(
                `Failed to read UPS config: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    private parseApcupsdConfig(content: string): Record<string, any> {
        return content
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith('#'))
            .map((line) => line.match(/^([A-Z_]+)\s+(.+)$/))
            .filter((match): match is RegExpMatchArray => match !== null)
            .reduce(
                (config, match) => {
                    const [, directive, value] = match;
                    let parsedValue = value.trim();

                    // Remove quotes if present
                    if (parsedValue.startsWith('"') && parsedValue.endsWith('"')) {
                        parsedValue = parsedValue.slice(1, -1);
                    }

                    // Convert numeric values
                    config[directive] = /^\d+$/.test(parsedValue)
                        ? parseInt(parsedValue, 10)
                        : parsedValue;

                    return config;
                },
                {} as Record<string, any>
            );
    }

    private generateApcupsdConfig(config: Partial<UPSConfig>, existingConfig: UPSConfig): string {
        // Merge with existing config, new values override existing ones
        const mergedConfig = { ...existingConfig, ...config };

        // Define the order of directives
        const orderedDirectives = [
            'UPSNAME',
            'UPSCABLE',
            'UPSTYPE',
            'DEVICE',
            'BATTERYLEVEL',
            'MINUTES',
            'TIMEOUT',
            'NETSERVER',
            'NISIP',
            'MODELNAME',
        ];

        const lines: string[] = [];
        lines.push('# APC UPS Configuration File');
        lines.push('# Generated by Unraid API');
        lines.push('');

        // Add ordered directives first
        for (const directive of orderedDirectives) {
            if (mergedConfig[directive] !== undefined) {
                const value = mergedConfig[directive];
                lines.push(
                    `${directive} ${typeof value === 'string' && value.includes(' ') ? `"${value}"` : value}`
                );
            }
        }

        // Add any remaining directives not in the ordered list
        for (const [directive, value] of Object.entries(mergedConfig)) {
            if (!orderedDirectives.includes(directive as any) && value !== undefined) {
                lines.push(
                    `${directive} ${typeof value === 'string' && value.includes(' ') ? `"${value}"` : value}`
                );
            }
        }

        return lines.join('\n') + '\n';
    }
}
