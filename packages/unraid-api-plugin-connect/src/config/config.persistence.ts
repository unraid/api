import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, readFileSync } from 'fs';

import { ConfigFilePersister } from '@unraid/shared/services/config-file.js';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { parse as parseIni } from 'ini';

import type { MyServersConfig as LegacyConfig } from './my-servers.config.js';
import { emptyMyServersConfig, MyServersConfig } from './connect.config.js';

@Injectable()
export class ConnectConfigPersister extends ConfigFilePersister<MyServersConfig> {
    constructor(configService: ConfigService) {
        super(configService);
    }

    /**
     * @override
     * @returns The name of the config file.
     */
    fileName(): string {
        return 'connect.json';
    }

    /**
     * @override
     * @returns The key of the config in the config service.
     */
    configKey(): string {
        return 'connect.config';
    }

    /**
     * @override
     * @returns The default config object.
     */
    defaultConfig(): MyServersConfig {
        return emptyMyServersConfig();
    }

    /**
     * Validate the config object.
     * @override
     * @param config - The config object to validate.
     * @returns The validated config instance.
     */
    public async validate(config: object) {
        let instance: MyServersConfig;
        if (config instanceof MyServersConfig) {
            instance = config;
        } else {
            instance = plainToInstance(MyServersConfig, config, {
                enableImplicitConversion: true,
            });
        }
        await validateOrReject(instance);
        return instance;
    }

    /**
     * @override
     * @returns The migrated config object.
     */
    async migrateConfig(): Promise<MyServersConfig> {
        return await this.migrateLegacyConfig();
    }

    /**-----------------------------------------------------
     *  Helpers for migrating myservers.cfg to connect.json
     *------------------------------------------------------**/

    /**
     * Migrate the legacy config file to the new config format.
     * Loads into memory, but does not persist.
     *
     * @throws {Error} - If the legacy config file does not exist.
     * @throws {Error} - If the legacy config file is not parse-able.
     */
    private async migrateLegacyConfig(filePath?: string) {
        const myServersCfgFile = await this.readLegacyConfig(filePath);
        const legacyConfig = this.parseLegacyConfig(myServersCfgFile);
        return await this.convertLegacyConfig(legacyConfig);
    }

    /**
     * Transform the legacy config object to the new config format.
     * @param filePath - The path to the legacy config file.
     * @returns A new config object.
     * @throws {Error} - If the legacy config file does not exist.
     * @throws {Error} - If the legacy config file is not parse-able.
     */
    public async convertLegacyConfig(config: LegacyConfig): Promise<MyServersConfig> {
        return this.validate({
            ...config.api,
            ...config.local,
            ...config.remote,
            // Convert string yes/no to boolean
            wanaccess: config.remote.wanaccess === 'yes',
            upnpEnabled: config.remote.upnpEnabled === 'yes',
            // Convert string port to number
            wanport: config.remote.wanport ? parseInt(config.remote.wanport, 10) : 0,
        });
    }

    /**
     * Get the legacy config from the filesystem.
     * @param filePath - The path to the legacy config file.
     * @returns The legacy config object.
     * @throws {Error} - If the legacy config file does not exist.
     * @throws {Error} - If the legacy config file is not parse-able.
     */
    private async readLegacyConfig(filePath?: string) {
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
        return readFileSync(filePath, 'utf8');
    }

    public parseLegacyConfig(iniFileContent: string): LegacyConfig {
        return parseIni(iniFileContent) as LegacyConfig;
    }
}
