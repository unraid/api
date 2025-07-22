import {
  Injectable,
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
    this.logger = new Logger(loggerName ?? `ConfigDefinition`);
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
   * This is abstract to allow different path resolution strategies:
   * - NestJS: Use ConfigService to get environment-based paths
   * - Standalone: Use constructor parameters or environment variables
   * - Testing: Use temporary directories
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
    throw new Error("Migration not implemented");
  }
}

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
    const config = this.definition.defaultConfig();
    
    try {
      const fileConfig = await this.readConfigFile();
      Object.assign(config, fileConfig);
      return config;
    } catch (error) {
      this.logger.warn(error, "Error loading config. Attempting to migrate...");
      
      try {
        const migratedConfig = await this.definition.migrateConfig();
        Object.assign(config, migratedConfig);
        // Persist migrated config for future loads
        await this.writeConfigFile(config);
        return config;
      } catch (migrationError) {
        this.logger.warn("Migration failed. Using defaults.", migrationError);
        return config;
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
  async readConfigFile(): Promise<T> {
    const configPath = this.definition.configPath();
    
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
    this.logger.verbose(`Writing config to ${this.definition.configPath()}: ${data}`);
    
    try {
      await writeFile(this.definition.configPath(), data);
      return true;
    } catch (error) {
      this.logger.error(error, `Error writing config to '${this.definition.configPath()}'`);
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
      const newConfig = { ...currentConfig, ...updates } as T;
      return await this.writeConfigFile(newConfig);
    } catch (error) {
      this.logger.error("Failed to update config", error);
      return false;
    }
  }
}

/**
 * Abstract base class for persisting configuration objects to JSON files on disk.
 * 
 * This class provides a robust configuration persistence layer that integrates with NestJS
 * while also providing standalone file operations through ConfigFileHandler delegation.
 *
 * **Key Features**:
 * - **NestJS Integration**: Integrates with ConfigService and lifecycle hooks
 * - **Reactive Updates**: Subscribes to config changes with 25ms buffering to reduce I/O operations
 * - **Standalone Access**: Provides `getFileHandler()` for direct file operations outside NestJS
 * - **Method Overrides**: Supports overriding `configPath()`, `validate()`, `migrateConfig()` etc.
 * - **Flash Drive Optimization**: Uses change detection to minimize unnecessary writes
 * - **Error Resilience**: Graceful handling of all error conditions
 * - **Lifecycle Management**: Proper cleanup of subscriptions and final persistence on destruction
 *
 * @template T The configuration object type that extends object
 *
 * @example
 * ```typescript
 * interface MyConfig {
 *   enabled: boolean;
 *   timeout: number;
 *   apiEndpoint: string;
 * }
 *
 * @Injectable()
 * class MyConfigPersister extends ConfigFilePersister<MyConfig> {
 *   constructor(configService: ConfigService) {
 *     super(configService);
 *   }
 *
 *   fileName() { return "my-config.json"; }
 *   configKey() { return "myConfig"; }
 *   
 *   defaultConfig(): MyConfig {
 *     return { 
 *       enabled: false, 
 *       timeout: 5000,
 *       apiEndpoint: 'https://api.example.com'
 *     };
 *   }
 *
 *   // Override path resolution if needed
 *   configPath(): string {
 *     return path.join('/custom/path', this.fileName());
 *   }
 *
 *   async validate(config: object): Promise<MyConfig> {
 *     const myConfig = config as MyConfig;
 *     if (myConfig.timeout < 1000) throw new Error("Timeout too low");
 *     return myConfig;
 *   }
 *
 *   async migrateConfig(): Promise<MyConfig> {
 *     // Load from legacy location or format
 *     const legacyConfig = await this.loadLegacyConfig();
 *     return {
 *       enabled: legacyConfig.isEnabled ?? true,
 *       timeout: legacyConfig.timeoutMs ?? 3000,
 *       apiEndpoint: legacyConfig.endpoint ?? 'https://api.example.com'
 *     };
 *   }
 * }
 *
 * // Usage in NestJS:
 * const myConfig = configService.get('myConfig');
 *
 * // Usage standalone (outside NestJS):
 * const fileHandler = myConfigPersister.getFileHandler();
 * await fileHandler.updateConfig({ timeout: 8000 });
 * ```
 */
export abstract class ConfigFilePersister<T extends object>
  extends ConfigDefinition<T>
  implements OnModuleInit, OnModuleDestroy
{
  private configObserver?: Subscription;
  private fileHandler: ConfigFileHandler<T>;

  /**
   * Creates a new ConfigFilePersister instance.
   * 
   * **Note**: The fileHandler is initialized after the constructor completes
   * to ensure all abstract methods are available.
   * 
   * @param configService The NestJS ConfigService instance for reactive config management
   */
  constructor(protected readonly configService: ConfigService) {
    super(`ConfigFilePersister`);
    // Update logger name after fileName() is available
    this.logger = new Logger(`ConfigFilePersister:${this.fileName()}`);
    this.fileHandler = new ConfigFileHandler(this);
  }

  /**
   * Returns the configuration key used in the ConfigService.
   *
   * This key is used to:
   * - Store/retrieve config from the ConfigService
   * - Filter config change events to only process relevant changes
   * - Namespace configuration to avoid conflicts
   *
   * @returns The config key string (e.g., "userPreferences", "apiSettings")
   * @example "myModuleConfig"
   */
  abstract configKey(): string;

  /**
   * Returns the absolute path to the configuration file.
   * Overrides parent to use NestJS ConfigService for path resolution.
   *
   * **Default Implementation**: Combines the `PATHS_CONFIG_MODULES` environment variable 
   * with the filename to create the full path where the config file should be stored.
   *
   * **Override Examples**:
   * - Custom directory: `path.join('/custom/config/dir', this.fileName())`
   * - User-specific: `path.join(os.homedir(), '.myapp', this.fileName())`
   * - Environment-based: `path.join(process.env.CONFIG_DIR, this.fileName())`
   *
   * @returns Absolute path to the config file
   * @throws Error if `PATHS_CONFIG_MODULES` environment variable is not set
   * @example "/usr/local/etc/unraid/config/my-config.json"
   */
  configPath(): string {
    return path.join(
      this.configService.getOrThrow("PATHS_CONFIG_MODULES"),
      this.fileName()
    );
  }

  /**
   * Returns a standalone ConfigFileHandler for direct file operations.
   * This allows the same config logic to be used outside of NestJS lifecycle.
   *
   * **Use Cases**:
   * - Reading config during application startup (before NestJS is ready)
   * - Standalone scripts that need config access
   * - Testing without full NestJS context
   * - Background jobs that run outside the main application
   *
   * @returns ConfigFileHandler instance for direct file operations
   *
   * @example
   * ```typescript
   * // In a NestJS service
   * @Injectable()
   * class MyService {
   *   constructor(private configPersister: MyConfigPersister) {}
   *
   *   async updateConfigDirectly() {
   *     const fileHandler = this.configPersister.getFileHandler();
   *     await fileHandler.updateConfig({ enabled: true });
   *   }
   * }
   *
   * // In a standalone script
   * const configPersister = new MyConfigPersister(mockConfigService);
   * const fileHandler = configPersister.getFileHandler();
   * const config = await fileHandler.loadConfig();
   * ```
   */
  getFileHandler(): ConfigFileHandler<T> {
    return this.fileHandler;
  }

  /**
   * NestJS lifecycle hook called when the module is being destroyed.
   *
   * Performs cleanup by:
   * 1. Unsubscribing from config change notifications to prevent memory leaks
   * 2. Persisting any final configuration state to disk to ensure no data loss
   *
   * This ensures that configuration changes made just before shutdown are not lost.
   */
  async onModuleDestroy() {
    this.configObserver?.unsubscribe();
    await this.persist();
  }

  /**
   * NestJS lifecycle hook called when the module is initialized.
   *
   * Performs initialization by:
   * 1. Loading existing config from disk (with migration fallback)
   * 2. Setting loaded config in the ConfigService for reactive access
   * 3. Setting up reactive config change subscription with 25ms buffering
   * 4. Filtering changes to only process events matching this config's key
   *
   * **Key Behavior**: Migration is prioritized over defaults when files don't exist.
   * The 25ms buffer reduces disk I/O by batching rapid config changes.
   *
   * **Config Change Detection**: Only persists when changes occur to this specific
   * config key, preventing unnecessary writes when other configs change.
   */
  async onModuleInit() {
    this.logger.verbose(`Config path: ${this.configPath()}`);
    await this.loadOrMigrateConfig();
    
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
   * Persists the configuration to disk using the underlying file handler.
   *
   * **Features**:
   * - Validates config before writing
   * - Uses change detection to avoid unnecessary writes (flash drive optimization)
   * - Handles all error conditions gracefully
   * - Logs operations at appropriate levels
   *
   * @param config - The config object to persist (defaults to current config from service)
   * @returns `true` if the config was persisted to disk, `false` if skipped or failed
   *
   * @example
   * ```typescript
   * // Persist current config from ConfigService
   * const persisted = await persister.persist();
   *
   * // Persist specific config object
   * const customConfig = { enabled: true, timeout: 8000 };
   * const persisted = await persister.persist(customConfig);
   * ```
   */
  async persist(config = this.configService.get(this.configKey())): Promise<boolean> {
    if (!config) {
      this.logger.warn(`Cannot persist undefined config`);
      return false;
    }
    return await this.fileHandler.writeConfigFile(config);
  }

  /**
   * Load or migrate configuration and set it in ConfigService.
   * 
   * This is the core initialization method that:
   * 1. Uses the file handler to load config (with migration fallback)
   * 2. Sets the loaded config in the NestJS ConfigService
   * 3. Persists the final config to disk (important for migrations)
   *
   * @returns `true` if config was successfully persisted, `false` if persistence failed
   * @private
   */
  private async loadOrMigrateConfig() {
    const config = await this.fileHandler.loadConfig();
    this.configService.set(this.configKey(), config);
    return this.persist(config);
  }

  /**
   * Loads and validates configuration from a JSON file.
   *
   * **Legacy Method**: This method is kept for backward compatibility.
   * For new code, prefer using `getFileHandler().readConfigFile()` for consistency.
   *
   * @param configFilePath - Path to config file (defaults to `configPath()`)
   * @returns Validated configuration object
   * @throws Error if file doesn't exist, contains invalid JSON, or fails validation
   * @deprecated Use getFileHandler().readConfigFile() for consistency
   */
  async getConfigFromFile(configFilePath = this.configPath()): Promise<T> {
    if (configFilePath !== this.configPath()) {
      // For custom paths, use the original implementation
      if (!(await fileExists(configFilePath))) {
        throw new Error(`Config file does not exist at '${configFilePath}'`);
      }
      return this.validate(JSON.parse(await readFile(configFilePath, "utf8")));
    }
    return await this.fileHandler.readConfigFile();
  }
}
