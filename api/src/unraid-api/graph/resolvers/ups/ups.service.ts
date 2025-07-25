import { Injectable, Logger } from '@nestjs/common';
import { readFile, writeFile } from 'fs/promises';

import { execa } from 'execa';
import { z } from 'zod';

import { fileExistsSync } from '@app/core/utils/files/file-exists.js';
import { UPSConfigInput } from '@app/unraid-api/graph/resolvers/ups/ups.inputs.js';

const UPSSchema = z.object({
    MODEL: z.string().optional(),
    STATUS: z.string().optional(),
    BCHARGE: z.string().optional(),
    TIMELEFT: z.string().optional(),
    LINEV: z.string().optional(),
    OUTPUTV: z.string().optional(),
    LOADPCT: z.string().optional(),
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
            // Validate required fields
            if (!config.upsType || (!config.device && config.upsType !== 'usb')) {
                throw new Error('upsType is required, and device is required for non-USB types');
            }

            // Stop the UPS service before making changes
            try {
                await execa('/etc/rc.d/rc.apcupsd', ['stop'], { timeout: 10000 });
            } catch (error) {
                this.logger.warn('Failed to stop apcupsd service (may not be running):', error);
            }

            // Read current configuration
            const currentConfig = await this.getCurrentConfig();

            // Prepare the new configuration with uppercase field names
            const cable = config.upsCable === 'custom' ? config.customUpsCable : config.upsCable;
            const newConfig: Partial<UPSConfig> = {
                NISIP: '0.0.0.0',
                SERVICE: config.service,
                UPSTYPE: config.upsType,
                DEVICE: config.device || '',
                BATTERYLEVEL: config.batteryLevel,
                MINUTES: config.minutes,
                TIMEOUT: config.timeout,
                UPSCABLE: cable,
                KILLUPS: config.killUps,
            };

            // Add optional override capacity if provided
            if (config.overrideUpsCapacity !== undefined && config.overrideUpsCapacity !== null) {
                newConfig.OVERRIDE_UPS_CAPACITY = config.overrideUpsCapacity;
            }

            // Backup the current configuration
            const backupPath = `${this.configPath}.backup`;
            try {
                if (fileExistsSync(this.configPath)) {
                    const currentContent = await readFile(this.configPath, 'utf-8');
                    await writeFile(backupPath, currentContent, 'utf-8');
                    this.logger.debug(`Backed up current config to ${backupPath}`);
                }
            } catch (error) {
                this.logger.warn('Failed to create config backup:', error);
            }

            // Generate and write the new configuration file
            const configContent = this.generateApcupsdConfig(newConfig, currentConfig);
            try {
                await writeFile(this.configPath, configContent, 'utf-8');
                this.logger.debug('Successfully wrote new UPS configuration');
            } catch (error) {
                // Try to restore backup if writing fails
                try {
                    if (fileExistsSync(backupPath)) {
                        const backupContent = await readFile(backupPath, 'utf-8');
                        await writeFile(this.configPath, backupContent, 'utf-8');
                        this.logger.warn('Restored config from backup after write failure');
                    }
                } catch (restoreError) {
                    this.logger.error('Failed to restore config backup:', restoreError);
                }
                throw error;
            }

            // Handle killpower configuration
            if (config.killUps === 'yes' && config.service === 'enable') {
                try {
                    // First check if apccontrol is already in rc.6
                    const { exitCode } = await execa('grep', ['-q', 'apccontrol', '/etc/rc.d/rc.6'], {
                        reject: false,
                    });

                    // If not found (exitCode !== 0), add it
                    if (exitCode !== 0) {
                        await execa('sed', [
                            '-i',
                            '-e',
                            's:/sbin/poweroff:/etc/apcupsd/apccontrol killpower; /sbin/poweroff:',
                            '/etc/rc.d/rc.6',
                        ]);
                        this.logger.debug('Added killpower to rc.6');
                    }
                } catch (error) {
                    this.logger.error('Failed to update rc.6 for killpower enable:', error);
                    throw new Error(
                        `Failed to enable killpower in /etc/rc.d/rc.6: ${error instanceof Error ? error.message : String(error)}`
                    );
                }
            } else {
                try {
                    // Check if apccontrol is in rc.6
                    const { exitCode } = await execa('grep', ['-q', 'apccontrol', '/etc/rc.d/rc.6'], {
                        reject: false,
                    });

                    // If found (exitCode === 0), remove it
                    if (exitCode === 0) {
                        await execa('sed', [
                            '-i',
                            '-e',
                            's:/etc/apcupsd/apccontrol killpower; /sbin/poweroff:/sbin/poweroff:',
                            '/etc/rc.d/rc.6',
                        ]);
                        this.logger.debug('Removed killpower from rc.6');
                    }
                } catch (error) {
                    this.logger.error('Failed to update rc.6 for killpower disable:', error);
                    throw new Error(
                        `Failed to disable killpower in /etc/rc.d/rc.6: ${error instanceof Error ? error.message : String(error)}`
                    );
                }
            }

            // Start the service if enabled
            if (config.service === 'enable') {
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
        } catch (error) {
            this.logger.error('Error configuring UPS:', error);
            throw new Error(
                `Failed to configure UPS: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    private parseUPSData(data: string): any {
        const lines = data.split('\n');
        const upsData = {};
        for (const line of lines) {
            const [key, value] = line.split(': ');
            if (key && value) {
                upsData[key.trim()] = value.trim();
            }
        }
        return upsData;
    }

    async getCurrentConfig(): Promise<UPSConfig> {
        try {
            if (!fileExistsSync(this.configPath)) {
                this.logger.warn(`UPS config file not found at ${this.configPath}`);
                return {};
            }

            const configContent = await readFile(this.configPath, 'utf-8');
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
        const config = {};
        const lines = content.split('\n');

        for (const line of lines) {
            const trimmedLine = line.trim();

            // Skip empty lines and comments
            if (!trimmedLine || trimmedLine.startsWith('#')) {
                continue;
            }

            // Match pattern: DIRECTIVE value or DIRECTIVE "value"
            const match = trimmedLine.match(/^([A-Z_]+)\s+(.+)$/);
            if (match) {
                const [, directive, value] = match;
                let parsedValue = value.trim();

                // Remove quotes if present
                if (parsedValue.startsWith('"') && parsedValue.endsWith('"')) {
                    parsedValue = parsedValue.slice(1, -1);
                }

                // Convert numeric values
                if (/^\d+$/.test(parsedValue)) {
                    config[directive] = parseInt(parsedValue, 10);
                } else {
                    config[directive] = parsedValue;
                }
            }
        }

        return config;
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
