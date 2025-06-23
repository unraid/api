import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, readFileSync } from 'fs';
import { writeFile } from 'fs/promises';
import path from 'path';

import { csvStringToArray } from '@unraid/shared/util/data.js';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { parse as parseIni } from 'ini';
import { isEqual } from 'lodash-es';
import { bufferTime } from 'rxjs/operators';

import type { MyServersConfig as LegacyConfig } from '../model/my-servers-config.model.js';
import { ConfigType, MyServersConfig } from '../model/connect-config.model.js';

@Injectable()
export class ConnectConfigPersister implements OnModuleInit, OnModuleDestroy {
    constructor(private readonly configService: ConfigService<ConfigType, true>) {}

    private logger = new Logger(ConnectConfigPersister.name);
    get configPath() {
        // PATHS_CONFIG_MODULES is a required environment variable.
        // It is the directory where custom config files are stored.
        return path.join(this.configService.getOrThrow('PATHS_CONFIG_MODULES'), 'connect.json');
    }

    async onModuleDestroy() {
        await this.persist();
    }

    async onModuleInit() {
        this.logger.verbose(`Config path: ${this.configPath}`);
        await this.loadOrMigrateConfig();
        // Persist changes to the config.
        this.configService.changes$.pipe(bufferTime(25)).subscribe({
            next: async (changes) => {
                const connectConfigChanged = changes.some(({ path }) => path.startsWith('connect.config'));
                if (connectConfigChanged) {
                    await this.persist();
                }
            },
            error: (err) => {
                this.logger.error('Error receiving config changes:', err);
            },
        });
    }

    /**
     * Persist the config to disk if the given data is different from the data on-disk.
     * This helps preserve the boot flash drive's life by avoiding unnecessary writes.
     *
     * @param config - The config object to persist.
     * @returns `true` if the config was persisted, `false` otherwise.
     */
    async persist(config = this.configService.get<MyServersConfig>('connect.config')) {
        try {
            if (isEqual(config, await this.loadConfig())) {
                this.logger.verbose(`Config is unchanged, skipping persistence`);
                return false;
            }
        } catch (error) {
            this.logger.error(error, `Error loading config (will overwrite file)`);
        }
        const data = JSON.stringify(config, null, 2);
        this.logger.verbose(`Persisting config to ${this.configPath}: ${data}`);
        try {
            await writeFile(this.configPath, data);
            this.logger.verbose(`Config persisted to ${this.configPath}`);
            return true;
        } catch (error) {
            this.logger.error(error, `Error persisting config to '${this.configPath}'`);
            return false;
        }
    }

    /**
     * Validate the config object.
     * @param config - The config object to validate.
     * @returns The validated config instance.
     */
    private async validate(config: object) {
        let instance: MyServersConfig;
        if (config instanceof MyServersConfig) {
            instance = config;
        } else {
            instance = plainToInstance(MyServersConfig, config, { enableImplicitConversion: true });
        }
        await validateOrReject(instance);
        return instance;
    }

    /**
     * Load the config from the filesystem, or migrate the legacy config file to the new config format.
     * When unable to load or migrate the config, messages are logged at WARN level, but no other action is taken.
     * @returns true if the config was loaded successfully, false otherwise.
     */
    private async loadOrMigrateConfig() {
        try {
            const config = await this.loadConfig();
            this.configService.set('connect.config', config);
            this.logger.verbose(`Config loaded from ${this.configPath}`);
            return true;
        } catch (error) {
            this.logger.warn('Error loading config:', error);
        }

        try {
            await this.migrateLegacyConfig();
            return this.persist();
        } catch (error) {
            this.logger.warn('Error migrating legacy config:', error);
        }

        this.logger.error(
            'Failed to load or migrate config from filesystem. Config is not persisted. Using defaults in-memory.'
        );
        return false;
    }

    /**
     * Load the JSON config from the filesystem
     * @throws {Error} - If the config file does not exist.
     * @throws {Error} - If the config file is not parse-able.
     * @throws {Error} - If the config file is not valid.
     */
    private async loadConfig(configFilePath = this.configPath) {
        if (!existsSync(configFilePath))
            throw new Error(`Config file does not exist at '${configFilePath}'`);
        return this.validate(JSON.parse(readFileSync(configFilePath, 'utf8')));
    }

    /**
     * Migrate the legacy config file to the new config format.
     * Loads into memory, but does not persist.
     *
     * @throws {Error} - If the legacy config file does not exist.
     * @throws {Error} - If the legacy config file is not parse-able.
     */
    private async migrateLegacyConfig() {
        const legacyConfig = await this.parseLegacyConfig();
        this.configService.set('connect.config', legacyConfig);
    }

    /**
     * Parse the legacy config file and return a new config object.
     * @param filePath - The path to the legacy config file.
     * @returns A new config object.
     * @throws {Error} - If the legacy config file does not exist.
     * @throws {Error} - If the legacy config file is not parse-able.
     */
    private async parseLegacyConfig(filePath?: string): Promise<MyServersConfig> {
        const config = await this.getLegacyConfig(filePath);
        return this.validate({
            ...config.api,
            ...config.local,
            ...config.remote,
            extraOrigins: csvStringToArray(config.api.extraOrigins),
        });
    }

    /**
     * Get the legacy config from the filesystem.
     * @param filePath - The path to the legacy config file.
     * @returns The legacy config object.
     * @throws {Error} - If the legacy config file does not exist.
     * @throws {Error} - If the legacy config file is not parse-able.
     */
    private async getLegacyConfig(filePath?: string) {
        filePath ??= this.configService.get(
            'PATHS_MY_SERVERS_CONFIG',
            '/boot/config/plugins/dynamix.my.servers/myservers.cfg'
        );
        if (!filePath) {
            throw new Error('No legacy config file path provided');
        }
        if (!existsSync(filePath)) {
            throw new Error(`Legacy config file does not exist: ${filePath}`);
        }
        return parseIni(readFileSync(filePath, 'utf8')) as LegacyConfig;
    }
}
