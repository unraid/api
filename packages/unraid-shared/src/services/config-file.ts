import {
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import path from "node:path";

import { isEqual } from "lodash-es";
import { bufferTime } from "rxjs/operators";
import { fileExists } from "../util/file.js";
import { readFile, writeFile } from "node:fs/promises";
import type { Subscription } from "rxjs";

export abstract class ConfigFilePersister<T extends object>
  implements OnModuleInit, OnModuleDestroy
{
  constructor(protected readonly configService: ConfigService) {
    this.logger = new Logger(`ConfigFilePersister:${this.fileName()}`);
  }

  private readonly logger: Logger;
  private configObserver?: Subscription;

  /**
   * @returns The name of the config file.
   */
  abstract fileName(): string; // defined as function so it can be used in constructor

  /**
   * @returns The key of the config in the config service.
   */
  abstract configKey(): string;

  /**
   * @returns The default config object.
   */
  abstract defaultConfig(): T;

  /**
   * @returns Absolute path to the config file.
   */
  configPath(): string {
    // PATHS_CONFIG_MODULES is a required environment variable.
    // It is the directory where custom config files are stored.
    return path.join(
      this.configService.getOrThrow("PATHS_CONFIG_MODULES"),
      this.fileName()
    );
  }

  async onModuleDestroy() {
    this.configObserver?.unsubscribe();
    await this.persist();
  }

  async onModuleInit() {
    this.logger.verbose(`Config path: ${this.configPath()}`);
    await this.loadOrMigrateConfig();
    // Persist changes to the config.
    this.configObserver = this.configService.changes$
      .pipe(bufferTime(25))
      .subscribe({
        next: async (changes) => {
          const configChanged = changes.some(({ path }) =>
            path.startsWith(this.configKey())
          );
          if (configChanged) {
            await this.persist();
          }
        },
        error: (err) => {
          this.logger.error("Error receiving config changes:", err);
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
  async persist(config = this.configService.get(this.configKey())) {
    try {
      if (isEqual(config, await this.getConfigFromFile())) {
        this.logger.verbose(`Config is unchanged, skipping persistence`);
        return false;
      }
    } catch (error) {
      this.logger.error(error, `Error loading config (will overwrite file)`);
    }
    const data = JSON.stringify(config, null, 2);
    this.logger.verbose(`Persisting config to ${this.configPath()}: ${data}`);
    try {
      await writeFile(this.configPath(), data);
      this.logger.verbose(`Config persisted to ${this.configPath()}`);
      return true;
    } catch (error) {
      this.logger.error(
        error,
        `Error persisting config to '${this.configPath()}'`
      );
      return false;
    }
  }

  /**
   * Validate the config object.
   * @param config - The config object to validate.
   * @returns The validated config instance.
   * @throws  If the config is not valid. Defaults to passthrough.
   */
  public async validate(config: object): Promise<T> {
    return config as T;
  }

  /**
   * 1. Loads and validates config from disk, or migrates if there is an error.
   * 2. Merges loaded/migrated config with defaults, sets it in the config service, and persists it to disk.
   *
   * When unable to load or migrate the config (e.g. file system corruption, first load for a fresh config),
   * messages are logged at WARN level and defaults are used/persisted.
   *
   * @returns true if the config was persisted to disk, false if migration failed or persistence was skipped/failed.
   */
  private async loadOrMigrateConfig() {
    const config = this.defaultConfig();
    try {
      Object.assign(config, await this.getConfigFromFile());
    } catch (error) {
      this.logger.warn(error, "Error loading config. Attempting to migrate...");
      try {
        Object.assign(config, await this.migrateConfig());
      } catch (error) {
        this.logger.warn("Migration failed. Using defaults in-memory.", error);
        return false;
      }
    }
    this.configService.set(this.configKey(), config);
    return this.persist(config);
  }

  /**
   * Load the JSON config from the filesystem
   * @throws {Error} - If the config file does not exist.
   * @throws {Error} - If the config file is not parse-able.
   * @throws {Error} - If the config file is not valid.
   */
  async getConfigFromFile(configFilePath = this.configPath()): Promise<T> {
    if (!(await fileExists(configFilePath))) {
      throw new Error(`Config file does not exist at '${configFilePath}'`);
    }
    return this.validate(JSON.parse(await readFile(configFilePath, "utf8")));
  }

  /**
   * Migrate config file to a new format.
   * @returns A config object in the new format.
   */
  async migrateConfig(): Promise<T> {
    throw new Error("Not implemented");
  }
}
