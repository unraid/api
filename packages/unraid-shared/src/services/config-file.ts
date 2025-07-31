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
 * Abstract base class for persisting configuration objects to JSON files.
 *
 * Provides NestJS integration with reactive config updates, standalone file operations,
 * and lifecycle management with automatic persistence.
 *
 * @template T The configuration object type that extends object
 *
 * @example
 * ```typescript
 * @Injectable()
 * class MyConfigPersister extends ConfigFilePersister<MyConfig> {
 *   constructor(configService: ConfigService) {
 *     super(configService);
 *   }
 *
 *   fileName() { return "my-config.json"; }
 *   configKey() { return "myConfig"; }
 *   defaultConfig(): MyConfig {
 *     return { enabled: false, timeout: 5000 };
 *   }
 * }
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
   * Returns a `structuredClone` of the current config object.
   * 
   * @param assertExists - Whether to throw an error if the config does not exist. Defaults to true.
   * @returns The current config object, or the default config if assertExists is false & no config exists
   */
  getConfig(assertExists: true): T;
  getConfig(assertExists: false): T;
  getConfig(): T;
  getConfig(assertExists: boolean = true): T {
    try {
      const config = this.configService.getOrThrow(this.configKey());
      return structuredClone(config);
    } catch (error) {
      if (assertExists) {
        throw error;
      } else {
        return this.defaultConfig();
      }
    }
  }

  /**
   * Replaces the current config with a new one. Will trigger a persistence attempt.
   * 
   * @param config - The new config object
   */
  replaceConfig(config: T) {
    this.configService.set(this.configKey(), config);
    this.persist(config);
  }

  /**
   * Returns the absolute path to the configuration file.
   * Combines `PATHS_CONFIG_MODULES` environment variable with the filename.
   * 
   * @throws Error if `PATHS_CONFIG_MODULES` environment variable is not set
   */
  configPath(): string {
    return path.join(
      this.configService.getOrThrow("PATHS_CONFIG_MODULES"),
      this.fileName()
    );
  }

  /**
   * Returns a standalone ConfigFileHandler for direct file operations outside NestJS.
   */
  getFileHandler(): ConfigFileHandler<T> {
    return this.fileHandler;
  }

  /**
   * NestJS lifecycle hook for cleanup.
   * Unsubscribes from config changes and persists final state.
   */
  async onModuleDestroy() {
    this.configObserver?.unsubscribe();
    await this.persist();
  }

  /**
   * NestJS lifecycle hook for initialization.
   * Loads config from disk and sets up reactive change subscription.
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
   * Persists configuration to disk with change detection optimization.
   * 
   * @param config - The config object to persist (defaults to current config from service)
   * @returns `true` if persisted to disk, `false` if skipped or failed
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
   */
  private async loadOrMigrateConfig() {
    const config = await this.fileHandler.loadConfig();
    this.configService.set(this.configKey(), config);
    return this.persist(config);
  }
}
