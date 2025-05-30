import { Logger } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { join } from 'path';

import { fileExists } from '@app/core/utils/files/file-exists.js';
import { PATHS_CONFIG_MODULES } from '@app/environment.js';
import { makeConfigToken } from '@app/unraid-api/config/factory/config.injection.js';
import { ConfigPersistenceHelper } from '@app/unraid-api/config/persistence.helper.js';

export interface ApiStateConfigOptions<T> {
    /**
     * The name of the config.
     *
     * - Must be unique.
     * - Should be the key representing this config in the `ConfigFeatures` interface.
     * - Used for logging and dependency injection.
     */
    name: string;
    defaultConfig: T;
    parse: (data: unknown) => T;
}

export class ApiStateConfig<T> {
    private config: T;
    private logger: Logger;

    constructor(
        readonly options: ApiStateConfigOptions<T>,
        readonly persistenceHelper: ConfigPersistenceHelper
    ) {
        // avoid sharing a reference with the given default config. This allows us to re-use it.
        this.config = structuredClone(options.defaultConfig);
        this.logger = new Logger(this.token);
    }

    /** Unique token for this config. Used for Dependency Injection & logging. */
    get token() {
        return makeConfigToken(this.options.name);
    }

    get fileName() {
        return `${this.options.name}.json`;
    }

    get filePath() {
        return join(PATHS_CONFIG_MODULES, this.fileName);
    }

    /**
     * Persists the config to the file system. Will never throw.
     * @param config - The config to persist.
     * @returns True if the config was written successfully, false otherwise.
     */
    async persist(config = this.config) {
        try {
            await this.persistenceHelper.persistIfChanged(this.filePath, config);
            return true;
        } catch (error) {
            this.logger.error(error, `Could not write config to ${this.filePath}.`);
            return false;
        }
    }

    /**
     * Reads the config from a path (defaults to the default file path of the config).
     * @param opts - The options for the read operation.
     * @param opts.filePath - The path to the config file.
     * @returns The parsed config or undefined if the file does not exist.
     * @throws If the file exists but is invalid.
     */
    async parseConfig(opts: { filePath?: string } = {}): Promise<T | undefined> {
        const { filePath = this.filePath } = opts;
        if (!(await fileExists(filePath))) return undefined;

        const rawConfig = JSON.parse(await readFile(filePath, 'utf8'));
        return this.options.parse(rawConfig);
    }

    /**
     * Loads config from the file system. If the file does not exist, it will be created with the default config.
     * If the config is invalid or corrupt, no action will be taken. The error will be logged.
     *
     * Will never throw.
     */
    async load() {
        try {
            const config = await this.parseConfig();
            if (config) {
                this.config = config;
            } else {
                this.logger.log(`Config file does not exist. Writing default config.`);
                this.config = this.options.defaultConfig;
                await this.persist();
            }
        } catch (error) {
            this.logger.warn(error, `Config file '${this.filePath}' is invalid. Not modifying config.`);
        }
    }

    update(config: Partial<T>) {
        const proposedConfig = this.options.parse({ ...this.config, ...config });
        this.config = proposedConfig;
        return this;
    }
}
