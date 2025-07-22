import {
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import path from "node:path";

import { bufferTime } from "rxjs/operators";
import type { Subscription } from "rxjs";
import { ConfigFileHandler } from "../util/config-file-handler.js";
import { ConfigDefinition } from "../util/config-definition.js";

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
    super();
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
  async persist(
    config = this.configService.get(this.configKey())
  ): Promise<boolean> {
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
}
