import { Logger } from "@nestjs/common";

/**
 * Abstract base class for configuration behavior without NestJS dependencies.
 * Provides core configuration logic including file path resolution, defaults,
 * validation, and migration support.
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
 * class MyConfigDefinition extends ConfigDefinition<MyConfig> {
 *   constructor(private configDir: string) {
 *     super('MyConfig');
 *   }
 *
 *   fileName() { return "my-config.json"; }
 *   configPath() { return path.join(this.configDir, this.fileName()); }
 *   defaultConfig(): MyConfig { return { enabled: false, timeout: 5000 }; }
 *
 *   async validate(config: object): Promise<MyConfig> {
 *     const myConfig = config as MyConfig;
 *     if (myConfig.timeout < 1000) throw new Error("Timeout too low");
 *     return myConfig;
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
   */
  abstract configPath(): string;

  /**
   * Returns the default configuration object.
   * Used as fallback when migration fails or as base for merging.
   */
  abstract defaultConfig(): T;

  /**
   * Validates and transforms a configuration object.
   *
   * Override to implement custom validation logic such as:
   * - Schema validation
   * - Range checking for numeric values
   * - Data transformation/normalization
   *
   * @param config - The raw config object to validate
   * @returns The validated and potentially transformed config
   * @throws Error if the config is invalid
   */
  async validate(config: object): Promise<T> {
    return config as T;
  }

  /**
   * Migrates legacy or corrupted configuration to the current format.
   *
   * Called when:
   * - Config file doesn't exist (first-time setup)
   * - Config file contains invalid JSON
   * - Config validation fails
   *
   * Override to provide custom migration logic for legacy formats,
   * version upgrades, or first-time installations.
   * 
   * Note:
   * - Backwards-compatible updates such as field additions are better handled via `defaultConfig()`
   * because `defaultConfig()` is merged with the loaded config.
   *
   * @returns Migrated configuration object
   * @throws Error if migration is not possible (falls back to defaults)
   */
  async migrateConfig(): Promise<T> {
    throw new Error("Not implemented");
  }
}
