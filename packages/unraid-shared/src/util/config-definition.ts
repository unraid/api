import { Logger } from "@nestjs/common";

/**
 * Abstract base class that defines configuration behavior without NestJS dependencies.
 * This can be extended and used both standalone and with NestJS integration.
 *
 * This class provides the core configuration logic including:
 * - **File Path Resolution**: Abstract `configPath()` method for flexible path handling
 * - **Default Configuration**: Fallback values when files don't exist or are corrupted
 * - **Validation Logic**: Optional validation and transformation of config data
 * - **Migration Support**: Legacy config conversion during upgrades
 *
 * @template T The configuration object type that extends object
 *
 * @example
 * ```typescript
 * interface MyConfig {
 *   enabled: boolean;
 *   timeout: number;
 *   apiKey?: string;
 * }
 *
 * class MyConfigDefinition extends ConfigDefinition<MyConfig> {
 *   constructor(private configDir: string) {
 *     super('MyConfig');
 *   }
 *
 *   fileName() { return "my-config.json"; }
 *
 *   configPath() {
 *     return path.join(this.configDir, this.fileName());
 *   }
 *
 *   defaultConfig(): MyConfig {
 *     return { enabled: false, timeout: 5000 };
 *   }
 *
 *   async validate(config: object): Promise<MyConfig> {
 *     const myConfig = config as MyConfig;
 *     if (myConfig.timeout < 1000) throw new Error("Timeout too low");
 *     return myConfig;
 *   }
 *
 *   async migrateConfig(): Promise<MyConfig> {
 *     // Try to load from legacy location
 *     const legacyPath = path.join(this.configDir, 'old-config.ini');
 *     // ... migration logic
 *     return { enabled: true, timeout: 3000 };
 *   }
 * }
 * ```
 */
export abstract class ConfigDefinition<T extends object> {
  protected logger: Logger;

  /**
   * @param loggerName Optional custom logger name (defaults to generic name)
   */
  constructor(loggerName?: string) {
    this.logger = new Logger(loggerName ?? `ConfigDefinition:${this.fileName()}`);
  }

  /**
   * Returns the filename for the configuration file.
   *
   * @returns The name of the config file (e.g., "my-config.json")
   * @example "user-preferences.json"
   */
  abstract fileName(): string;

  /**
   * Returns the absolute path to the configuration file.
   *
   * @returns Absolute path to the config file
   * @example "/usr/local/etc/unraid/config/my-config.json"
   */
  abstract configPath(): string;

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
   *     retries: 3,
   *     features: {
   *       autoBackup: true,
   *       notifications: false
   *     }
   *   };
   * }
   * ```
   */
  abstract defaultConfig(): T;

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
   * - Environment-specific validation
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
   *   // Type validation
   *   if (typeof myConfig.timeout !== 'number' || myConfig.timeout < 1000) {
   *     throw new Error('Invalid timeout: must be number >= 1000');
   *   }
   *
   *   // Enum validation
   *   if (!['low', 'medium', 'high'].includes(myConfig.priority)) {
   *     throw new Error('Invalid priority level');
   *   }
   *
   *   // Data transformation
   *   myConfig.apiKey = myConfig.apiKey?.trim() || undefined;
   *
   *   return myConfig;
   * }
   * ```
   */
  async validate(config: object): Promise<T> {
    return config as T;
  }

  /**
   * Migrates legacy or corrupted configuration to the current format.
   *
   * **Default Implementation**: Throws "Migration not implemented" error.
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
   * - **Version Upgrades**: Handle breaking changes between config versions
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
   *   try {
   *     // Try to load legacy config format
   *     const legacyPath = path.join(this.configDir, 'old-config.ini');
   *     const legacyData = await this.readLegacyIniFile(legacyPath);
   *
   *     return {
   *       enabled: legacyData.isEnabled === 'true',
   *       timeout: parseInt(legacyData.timeoutMs) || 5000,
   *       apiKey: legacyData.secret,
   *       newFeature: 'default-value' // New property not in legacy
   *     };
   *   } catch (legacyError) {
   *     // Try environment variables for first-time setup
   *     if (process.env.MY_CONFIG_ENABLED) {
   *       return {
   *         enabled: process.env.MY_CONFIG_ENABLED === 'true',
   *         timeout: parseInt(process.env.MY_CONFIG_TIMEOUT) || 3000,
   *         newFeature: 'env-setup'
   *       };
   *     }
   *
   *     // Last resort: throw to use defaults
   *     throw new Error('No migration path available');
   *   }
   * }
   * ```
   */
  async migrateConfig(): Promise<T> {
    throw new Error("Not implemented");
  }
}
