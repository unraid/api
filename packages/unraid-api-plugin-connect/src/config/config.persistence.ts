import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, readFileSync } from 'fs';
import { X509Certificate } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import { ConfigFilePersister } from '@unraid/shared/services/config-file.js';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { parse as parseIni } from 'ini';

import type { MyServersConfig as LegacyConfig } from './my-servers.config.js';
import { validateGatewayServices } from '../tunnel/gateway-settings.js';
import { emptyMyServersConfig, MyServersConfig } from './connect.config.js';
import { writePrivateJson } from './private-json-file.js';

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

    override configPath(): string {
        return this.configService.get<string>('CONNECT_CONFIG_PATH') ?? super.configPath();
    }

    /**
     * @override
     * @returns The default config object.
     */
    defaultConfig(): MyServersConfig {
        return { ...emptyMyServersConfig(), certificateManagementEnabled: this.hasCertificate() };
    }

    /**
     * Validate the config object.
     * @override
     * @param config - The config object to validate.
     * @returns The validated config instance.
     */
    public async validate(config: object) {
        const instance = plainToInstance(MyServersConfig, {
            ...this.defaultConfig(),
            ...config,
        });
        await validateOrReject(instance, { whitelist: true });
        instance.gatewayServices = validateGatewayServices(instance.gatewayServices);
        instance.gatewayServiceRoutes = validateGatewayServiceRoutes(instance.gatewayServiceRoutes);
        if (!instance.certificateManagementEnabled) instance.tunnelRemoteAccessEnabled = false;
        return instance;
    }

    private hasCertificate(): boolean {
        try {
            const certificate = new X509Certificate(
                readFileSync(this.configService.getOrThrow<string>('CONNECT_CERT_BUNDLE_PATH'))
            );
            return /(?:DNS:|CN=)(?:\*\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.myunraid\.net(?:,|\n|$)/i.test(
                `${certificate.subjectAltName ?? ''}\n${certificate.subject}`
            );
        } catch {
            return false;
        }
    }

    private writes: Promise<boolean> = Promise.resolve(true);

    override persist(config = this.getConfig(false)): Promise<boolean> {
        const data = JSON.stringify(config, null, 2);
        this.writes = this.writes
            .catch(() => false)
            .then(async () => {
                await writePrivateJson(this.configPath(), data);
                return true;
            });
        return this.writes;
    }

    override async onModuleInit(): Promise<void> {
        const config = existsSync(this.configPath())
            ? await this.validate(JSON.parse(await readFile(this.configPath(), 'utf8')))
            : existsSync(
                    this.configService.get<string>('CONNECT_LEGACY_PATH') ??
                        this.configService.get<string>('PATHS_MY_SERVERS_CONFIG') ??
                        '/boot/config/plugins/dynamix.my.servers/myservers.cfg'
                )
              ? await this.migrateConfig()
              : this.defaultConfig();
        await this.save(config);
    }

    override async onModuleDestroy(): Promise<void> {
        await this.updates;
        await this.writes;
        await this.persist();
    }

    private updates: Promise<void> = Promise.resolve();

    update(changes: Partial<MyServersConfig>): Promise<void> {
        const update = this.updates
            .catch(() => undefined)
            .then(() => this.save({ ...this.getConfig(), ...changes }));
        this.updates = update;
        return update;
    }

    async save(config: MyServersConfig): Promise<void> {
        const valid = await this.validate(config);
        await this.persist(valid);
        this.configService.set(this.configKey(), valid);
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
            'CONNECT_LEGACY_PATH',
            this.configService.get(
                'PATHS_MY_SERVERS_CONFIG',
                '/boot/config/plugins/dynamix.my.servers/myservers.cfg'
            )
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

function validateGatewayServiceRoutes(value: Record<string, string>): Record<string, string> {
    if (!value || Array.isArray(value) || typeof value !== 'object') return {};
    const entries = Object.entries(value);
    if (entries.length > 31) throw new Error('Use at most 31 service routes');
    for (const [id, hostname] of entries) {
        const suffix = id.replace(/^app-/, '');
        if (
            !/^app-[a-f0-9]{16}$/.test(id) ||
            typeof hostname !== 'string' ||
            !new RegExp(
                `^tun-[a-f0-9]{32}-${suffix}\\.[a-z0-9-]+\\.(?:preview\\.)?myunraid\\.net$`
            ).test(hostname)
        )
            throw new Error('Invalid service route');
    }
    return Object.fromEntries(entries);
}
