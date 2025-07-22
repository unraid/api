import { Logger } from "@nestjs/common";
import { readFile, writeFile } from "node:fs/promises";
import { isEqual } from "lodash-es";
import { ConfigDefinition } from "./config-definition.js";
import { fileExists } from "./file.js";

/**
 * Standalone configuration file handler that works with any ConfigDefinition.
 * Can be used independently of NestJS DI container.
 *
 * This class provides robust file operations with the following features:
 * - **Migration Priority**: When files don't exist, migration is attempted before falling back to defaults
 * - **Change Detection**: Uses deep equality checks to avoid unnecessary disk writes (flash drive optimization)
 * - **Error Resilience**: Graceful handling of file system errors, JSON parsing failures, and validation errors
 * - **Atomic Operations**: Individual methods for specific file operations (read, write, update)
 *
 * @template T The configuration object type that extends object
 *
 * @example
 * ```typescript
 * // Standalone usage
 * const configDef = new MyConfigDefinition('/etc/myapp');
 * const fileHandler = new ConfigFileHandler(configDef);
 *
 * // Load config with migration fallback
 * const config = await fileHandler.loadConfig();
 *
 * // Update specific properties
 * await fileHandler.updateConfig({ enabled: true, timeout: 8000 });
 *
 * // Direct file operations
 * const currentConfig = await fileHandler.readConfigFile();
 * await fileHandler.writeConfigFile(newConfig);
 * ```
 */
export class ConfigFileHandler<T extends object> {
  private readonly logger: Logger;

  /**
   * @param definition The configuration definition that provides behavior
   */
  constructor(private readonly definition: ConfigDefinition<T>) {
    this.logger = new Logger(`ConfigFileHandler:${definition.fileName()}`);
  }

  /**
   * Loads configuration from file, with migration fallback.
   *
   * **Migration Priority Strategy**:
   * 1. **Load**: Attempts to load and validate existing config from disk
   * 2. **Migrate**: If loading fails, attempts migration using `migrateConfig()`
   * 3. **Default**: If migration fails, falls back to `defaultConfig()`
   * 4. **Merge**: Merges result with defaults to ensure all properties exist
   * 5. **Persist**: If migration occurred, writes final config to disk
   *
   * **Key Insight**: Migration is attempted before using defaults, making this suitable
   * for upgrading legacy configurations or handling first-time installations.
   *
   * **Error Handling**: All errors are logged at WARN level, ensuring the system
   * continues to function with sensible defaults even if file system issues occur.
   *
   * @returns Complete configuration object (defaults + loaded/migrated data)
   *
   * @example
   * ```typescript
   * // Load config - handles all error cases gracefully
   * const config = await fileHandler.loadConfig();
   * console.log('Loaded config:', config);
   *
   * // Always returns valid config object, even if file doesn't exist
   * const alwaysValid = await fileHandler.loadConfig();
   * console.log('Timeout:', alwaysValid.timeout); // Safe to access
   * ```
   */
  async loadConfig(): Promise<T> {
    const defaultConfig = this.definition.defaultConfig();

    try {
      const fileConfig = await this.readConfigFile();
      return await this.definition.validate({ ...defaultConfig, ...fileConfig });
    } catch (error) {
      this.logger.warn(error, "Error loading config. Attempting to migrate...");

      try {
        const migratedConfig = await this.definition.migrateConfig();
        const mergedConfig = await this.definition.validate({
          ...defaultConfig,
          ...migratedConfig,
        });
        // Persist migrated config for future loads
        await this.writeConfigFile(mergedConfig);
        return mergedConfig;
      } catch (migrationError) {
        this.logger.warn("Migration failed. Using defaults.", migrationError);
        return defaultConfig;
      }
    }
  }

  /**
   * Reads and validates configuration from file.
   *
   * **Process**:
   * 1. Checks if file exists using `fileExists()` utility
   * 2. Reads file content as UTF-8 text
   * 3. Parses JSON content
   * 4. Validates result using `validate()` method from definition
   *
   * **Error Cases**:
   * - File doesn't exist → Error (triggers migration in caller)
   * - Invalid JSON syntax → Error (triggers migration in caller)
   * - Validation failure → Error (triggers migration in caller)
   *
   * @param configPath - Path to config file (defaults to `configPath()`)
   * @returns Validated configuration object from disk
   * @throws Error if file doesn't exist, contains invalid JSON, or fails validation
   *
   * @example
   * ```typescript
   * try {
   *   const config = await fileHandler.readConfigFile();
   *   console.log('Successfully loaded config from disk:', config);
   * } catch (error) {
   *   console.log('Config file issue, will attempt migration/defaults');
   * }
   * ```
   */
  async readConfigFile(configPath = this.definition.configPath()): Promise<T> {
    if (!(await fileExists(configPath))) {
      throw new Error(`Config file does not exist at '${configPath}'`);
    }
    const content = await readFile(configPath, "utf8");
    const parsed = JSON.parse(content);
    return await this.definition.validate(parsed);
  }

  /**
   * Writes configuration to file with intelligent change detection.
   *
   * **Flash Drive Optimization**: Uses deep equality checks to avoid unnecessary writes,
   * helping preserve the lifespan of boot flash drives by preventing redundant I/O operations.
   *
   * **Process**:
   * 1. Validates config using definition's `validate()` method
   * 2. Compares new config with existing file content using deep equality
   * 3. Skips write if content is identical (logs at verbose level)
   * 4. Writes pretty-printed JSON (2-space indentation) if changes detected
   * 5. Handles file system errors gracefully
   *
   * @param config - The config object to write to disk
   * @returns `true` if the config was written to disk, `false` if skipped (no changes) or failed
   *
   * @example
   * ```typescript
   * const newConfig = { enabled: true, timeout: 8000 };
   *
   * // Write config - automatically skips if unchanged
   * const written = await fileHandler.writeConfigFile(newConfig);
   * if (written) {
   *   console.log('Config updated on disk');
   * } else {
   *   console.log('Config unchanged, skipped write');
   * }
   * ```
   */
  async writeConfigFile(config: T): Promise<boolean> {
    try {
      config = await this.definition.validate(config);
    } catch (error) {
      this.logger.error(error, `Cannot write invalid config`);
      return false;
    }

    // Skip write if config is unchanged (flash drive optimization)
    try {
      const existingConfig = await this.readConfigFile();
      if (isEqual(config, existingConfig)) {
        this.logger.verbose(`Config is unchanged, skipping write`);
        return false;
      }
    } catch (error) {
      // File doesn't exist or is invalid, proceed with write
      this.logger.verbose(`Existing config unreadable, proceeding with write`);
    }

    const data = JSON.stringify(config, null, 2);
    this.logger.verbose(
      `Writing config to ${this.definition.configPath()}: ${data}`
    );

    try {
      await writeFile(this.definition.configPath(), data);
      return true;
    } catch (error) {
      this.logger.error(
        error,
        `Error writing config to '${this.definition.configPath()}'`
      );
      return false;
    }
  }

  /**
   * Updates configuration by merging with existing config.
   *
   * **Process**:
   * 1. Loads current config from disk (with migration/defaults fallback)
   * 2. Merges provided updates with current config
   * 3. Writes merged result back to disk
   *
   * This is ideal for making partial updates without losing other configuration values.
   *
   * @param updates - Partial configuration object with properties to update
   * @returns `true` if the config was updated on disk, `false` if failed or no changes
   *
   * @example
   * ```typescript
   * // Update just the timeout, keep other settings unchanged
   * const updated = await fileHandler.updateConfig({ timeout: 10000 });
   *
   * // Update multiple properties
   * const multiUpdate = await fileHandler.updateConfig({
   *   enabled: true,
   *   timeout: 8000,
   *   features: { autoBackup: false }
   * });
   * ```
   */
  async updateConfig(updates: Partial<T>): Promise<boolean> {
    try {
      const currentConfig = await this.loadConfig();
      const newConfig = await this.definition.validate({
        ...currentConfig,
        ...updates,
      });
      return await this.writeConfigFile(newConfig);
    } catch (error) {
      this.logger.error("Failed to update config", error);
      return false;
    }
  }
}
