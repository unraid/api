import { Logger } from "@nestjs/common";
import { readFile, writeFile } from "atomically";
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
 * const configDef = new MyConfigDefinition('/etc/myapp');
 * const fileHandler = new ConfigFileHandler(configDef);
 *
 * // Load config with migration fallback
 * const config = await fileHandler.loadConfig();
 *
 * // Update specific properties
 * await fileHandler.updateConfig({ enabled: true });
 * ```
 */
export class ConfigFileHandler<T extends object> {
  private readonly logger: Logger

  /**
   * @param definition The configuration definition that provides behavior
   */
  constructor(private readonly definition: ConfigDefinition<T>, logger?: Logger) {
    this.logger = logger ?? new Logger(`ConfigFileHandler:${definition.fileName()}`);
  }

  /**
   * Loads configuration from file, with migration fallback.
   *
   * Strategy:
   * 1. Load and validate existing config
   * 2. If loading fails, attempt migration
   * 3. If migration fails, use defaults
   * 4. Merge result with defaults and persist if migrated
   *
   * @returns Complete configuration object
   */
  async loadConfig(): Promise<T> {
    const defaultConfig = this.definition.defaultConfig();

    try {
      const fileConfig = await this.readConfigFile();
      return await this.definition.validate({
        ...defaultConfig,
        ...fileConfig,
      });
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
   * @param configPath - Path to config file (defaults to `configPath()`)
   * @returns Validated configuration object from disk
   * @throws Error if file doesn't exist, contains invalid JSON, or fails validation
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
   * Writes configuration to file with change detection optimization.
   * Uses deep equality checks to avoid unnecessary writes.
   *
   * @param config - The config object to write to disk
   * @returns `true` if written to disk, `false` if skipped or failed
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

    try {
      const data = JSON.stringify(config, null, 2);
      this.logger.verbose(`Writing config to ${this.definition.configPath()}`);
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
   * Loads current config, shallow merges updates, and writes back to disk.
   *
   * @param updates - Partial configuration object with properties to update
   * @returns `true` if updated on disk, `false` if failed or no changes
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
