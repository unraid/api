import { Logger } from '@nestjs/common';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'path';

import type { ZodType } from 'zod';

import { fileExists } from '@app/core/utils/files/file-exists.js';
import { CONFIG_MODULES_HOME } from '@app/environment.js';

import { ConfigRegistry } from './config.registry.js';

export interface ApiStateConfigOptions<T> {
    /** The name of the config. Must be unique. Used for logging and dependency injection. */
    name: string;
    zodSchema: ZodType<T>;
    defaultConfig: T;
}

export class ApiStateConfig<T> {
    private config: T;
    private logger: Logger;

    constructor(readonly options: ApiStateConfigOptions<T>) {
        // config registration must be first. otherwise, the unique token will not be registered/available.
        ConfigRegistry.register(this.options.name, ApiStateConfig.name);
        // avoid sharing a reference with the given default config. This allows us to re-use it.
        this.config = structuredClone(options.defaultConfig);
        this.logger = new Logger(this.token);
    }

    /** Unique token for this config. Used for Dependency Injection & logging. */
    get token() {
        return ConfigRegistry.getConfigToken(this.options.name);
    }

    get fileName() {
        return `${this.options.name}.json`;
    }

    get filePath() {
        return join(CONFIG_MODULES_HOME, this.fileName);
    }

    get schema() {
        return this.options.zodSchema;
    }

    /**
     * Persists the config to the file system. Will never throw.
     * @param config - The config to persist.
     * @returns True if the config was written successfully, false otherwise.
     */
    async persist(config = this.config) {
        try {
            await writeFile(this.filePath, JSON.stringify(config, null, 2));
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
        return this.options.zodSchema.parse(rawConfig);
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
        const proposedConfig = this.schema.parse({ ...this.config, ...config });
        this.config = proposedConfig;
    }
}
