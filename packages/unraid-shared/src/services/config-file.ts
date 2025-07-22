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

/**
 * Abstract base class for persisting configuration objects to JSON files on disk.
 *
 * This class provides a robust configuration persistence layer with the following features:
 * - **Migration Priority**: When files don't exist, migration is attempted before falling back to defaults
 * - **Change Detection**: Uses deep equality checks to avoid unnecessary disk writes (flash drive optimization)
 * - **Reactive Updates**: Subscribes to config changes with 25ms buffering to reduce I/O operations
 * - **Error Resilience**: Graceful handling of file system errors, JSON parsing failures, and validation errors
 * - **Lifecycle Management**: Proper cleanup of subscriptions and final persistence on module destruction
 *
 * @template T The configuration object type that extends object
 *
 * @example
 * ```typescript
 * interface MyConfig {
 *   enabled: boolean;
 *   timeout: number;
 * }
 *
 * class MyConfigPersister extends ConfigFilePersister<MyConfig> {
 *   fileName() { return "my-config.json"; }
 *   configKey() { return "myConfig"; }
 *   defaultConfig() { return { enabled: false, timeout: 5000 }; }
 *
 *   async validate(config: object): Promise<MyConfig> {
 *     const myConfig = config as MyConfig;
 *     if (myConfig.timeout < 1000) throw new Error("Timeout too low");
 *     return myConfig;
 *   }
 *
 *   async migrateConfig(): Promise<MyConfig> {
 *     // Custom migration logic for legacy configs
 *     return { enabled: true, timeout: 3000 };
 *   }
 * }
 * ```
 */
export abstract class ConfigFilePersister<T extends object>
  implements OnModuleInit, OnModuleDestroy
{
  constructor(protected readonly configService: ConfigService) {
    this.logger = new Logger(`ConfigFilePersister:${this.fileName()}`);
  }

  private readonly logger: Logger;
  private configObserver?: Subscription;

  /**
   * Returns the filename for the configuration file.
   *
   * @returns The name of the config file (e.g., "my-config.json")
   * @example "user-preferences.json"
   */
  abstract fileName(): string; // defined as function so it can be used in constructor

  /**
   * Returns the configuration key used in the ConfigService.
   *
   * This key is used to:
   * - Store/retrieve config from the ConfigService
   * - Filter config change events to only process relevant changes
   *
   * @returns The config key string (e.g., "userPreferences")
   * @example "myModuleConfig"
   */
  abstract configKey(): string;

  /**
   * Returns the default configuration object.
   *
   * **Important**: This is used as a fallback when migration fails or as a base
   * for merging with loaded/migrated configurations.
   *
   * @returns The default configuration object
   * @example
   * ```typescript
   * defaultConfig(): MyConfig {
   *   return {
   *     enabled: false,
   *     timeout: 5000,
   *     retries: 3
   *   };
   * }
   * ```
   */
  abstract defaultConfig(): T;

  /**
   * Returns the absolute path to the configuration file.
   *
   * Combines the `PATHS_CONFIG_MODULES` environment variable with the filename
   * to create the full path where the config file should be stored.
   *
   * @returns Absolute path to the config file
   * @throws Error if `PATHS_CONFIG_MODULES` environment variable is not set
   * @example "/usr/local/etc/unraid/config/my-config.json"
   */
  configPath(): string {
    // PATHS_CONFIG_MODULES is a required environment variable.
    // It is the directory where custom config files are stored.
    return path.join(
      this.configService.getOrThrow("PATHS_CONFIG_MODULES"),
      this.fileName()
    );
  }

  /**
   * NestJS lifecycle hook called when the module is being destroyed.
   *
   * Performs cleanup by:
   * 1. Unsubscribing from config change notifications
   * 2. Persisting any final configuration state to disk
   *
   * This ensures no data loss and prevents memory leaks.
   */
  async onModuleDestroy() {
    this.configObserver?.unsubscribe();
    await this.persist();
  }

  /**
   * NestJS lifecycle hook called when the module is initialized.
   *
   * Performs initialization by:
   * 1. Loading existing config from disk or attempting migration
   * 2. Setting up reactive config change subscription with 25ms buffering
   * 3. Filtering changes to only process events matching this config's key
   *
   * **Key Behavior**: Migration is prioritized over defaults when files don't exist.
   * The 25ms buffer reduces disk I/O by batching rapid config changes.
   */
  async onModuleInit() {
    this.logger.verbose(`Config path: ${this.configPath()}`);
    await this.loadOrMigrateConfig();
    // Persist changes to the config.
    this.configObserver = this.configService.changes$
      .pipe(bufferTime(25))
      .subscribe({
        next: async (changes) => {
          const configChanged = changes.some(({ path }) =>
            path?.startsWith(this.configKey())
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
   * Persists the configuration to disk with intelligent change detection.
   *
   * **Flash Drive Optimization**: Uses deep equality checks to avoid unnecessary writes,
   * helping preserve the lifespan of boot flash drives by preventing redundant I/O operations.
   *
   * **Process**:
   * 1. Validates that config is not undefined
   * 2. Compares new config with existing file content using deep equality
   * 3. Skips write if content is identical
   * 4. Writes pretty-printed JSON (2-space indentation) if changes detected
   * 5. Handles file system errors gracefully
   *
   * @param config - The config object to persist (defaults to current config from service)
   * @returns `true` if the config was persisted to disk, `false` if skipped or failed
   *
   * @example
   * ```typescript
   * // Persist current config
   * const persisted = await persister.persist();
   *
   * // Persist specific config
   * const persisted = await persister.persist(myConfig);
   * ```
   */
  async persist(config = this.configService.get(this.configKey())): Promise<boolean> {
    if (!config) {
      this.logger.warn(`Cannot persist undefined config`);
      return false;
    }
    try {
      config = await this.validate(config);
    } catch (error) {
      this.logger.error(error, `Cannot persist invalid config`);
      return false; 
    }
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
   * Validates and transforms a configuration object.
   *
   * **Default Implementation**: Simple type cast (passthrough validation).
   * Override this method to implement custom validation logic.
   *
   * **Common Use Cases**:
   * - Schema validation (e.g., using Joi, Yup, or Zod)
   * - Range checking for numeric values
   * - Required field validation
   * - Data transformation/normalization
   *
   * @param config - The raw config object to validate
   * @returns The validated and potentially transformed config
   * @throws Error if the config is invalid (stops loading/migration process)
   *
   * @example
   * ```typescript
   * async validate(config: object): Promise<MyConfig> {
   *   const myConfig = config as MyConfig;
   *
   *   if (typeof myConfig.timeout !== 'number' || myConfig.timeout < 1000) {
   *     throw new Error('Invalid timeout: must be number >= 1000');
   *   }
   *
   *   if (!['low', 'medium', 'high'].includes(myConfig.priority)) {
   *     throw new Error('Invalid priority level');
   *   }
   *
   *   return myConfig;
   * }
   * ```
   */
  public async validate(config: object): Promise<T> {
    return config as T;
  }

  /**
   * Core initialization logic that loads, migrates, or creates configuration.
   *
   * **Migration Priority Strategy**:
   * 1. **Load**: Attempts to load and validate existing config from disk
   * 2. **Migrate**: If loading fails, attempts migration using `migrateConfig()`
   * 3. **Default**: If migration fails, falls back to `defaultConfig()`
   * 4. **Merge**: Merges result with defaults to ensure all properties exist
   * 5. **Store**: Sets final config in ConfigService
   * 6. **Persist**: Writes final config to disk
   *
   * **Key Insight**: Migration is attempted before using defaults, making this suitable
   * for upgrading legacy configurations or handling first-time installations.
   *
   * **Error Handling**: All errors are logged at WARN level, ensuring the system
   * continues to function with sensible defaults even if file system issues occur.
   *
   * @returns `true` if config was successfully persisted, `false` if persistence failed
   * @private
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
   * Loads and validates configuration from a JSON file.
   *
   * **Process**:
   * 1. Checks if file exists using `fileExists()` utility
   * 2. Reads file content as UTF-8 text
   * 3. Parses JSON content
   * 4. Validates result using `validate()` method
   *
   * **Error Cases**:
   * - File doesn't exist → Error (triggers migration in caller)
   * - Invalid JSON syntax → Error (triggers migration in caller)
   * - Validation failure → Error (triggers migration in caller)
   *
   * @param configFilePath - Path to config file (defaults to `configPath()`)
   * @returns Validated configuration object
   * @throws Error if file doesn't exist, contains invalid JSON, or fails validation
   *
   * @example
   * ```typescript
   * try {
   *   const config = await persister.getConfigFromFile();
   *   console.log('Loaded config:', config);
   * } catch (error) {
   *   console.log('Config loading failed, will attempt migration');
   * }
   * ```
   */
  async getConfigFromFile(configFilePath = this.configPath()): Promise<T> {
    if (!(await fileExists(configFilePath))) {
      throw new Error(`Config file does not exist at '${configFilePath}'`);
    }
    return this.validate(JSON.parse(await readFile(configFilePath, "utf8")));
  }

  /**
   * Migrates legacy or corrupted configuration to the current format.
   *
   * **Default Implementation**: Throws "Not implemented" error.
   * Override this method to provide custom migration logic.
   *
   * **When Called**:
   * - Config file doesn't exist (first-time setup)
   * - Config file contains invalid JSON
   * - Config validation fails
   * - File system read errors
   *
   * **Migration Strategies**:
   * - **Legacy Format**: Convert old config structure to new format
   * - **Partial Config**: Fill missing properties with sensible defaults
   * - **Corrupted Data**: Attempt to salvage usable parts
   * - **Fresh Install**: Return initial setup configuration
   *
   * **Priority**: Migration is attempted before falling back to `defaultConfig()`,
   * making this ideal for handling upgrades and first-time installations.
   *
   * @returns Migrated configuration object
   * @throws Error if migration is not possible (falls back to defaults)
   *
   * @example
   * ```typescript
   * async migrateConfig(): Promise<MyConfig> {
   *   // Try to load legacy config format
   *   try {
   *     const legacyPath = path.join(this.configDir, 'old-config.ini');
   *     const legacyData = await readLegacyConfig(legacyPath);
   *
   *     return {
   *       enabled: legacyData.isEnabled ?? true,
   *       timeout: legacyData.timeoutMs ?? 5000,
   *       newFeature: 'default-value' // New property not in legacy
   *     };
   *   } catch (error) {
   *     // First-time installation
   *     return {
   *       enabled: true,
   *       timeout: 3000,
   *       newFeature: 'initial-setup'
   *     };
   *   }
   * }
   * ```
   */
  async migrateConfig(): Promise<T> {
    throw new Error("Not implemented");
  }
}
