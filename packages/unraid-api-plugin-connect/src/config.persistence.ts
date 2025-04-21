import {
  Logger,
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { existsSync, readFileSync } from "fs";
import { writeFile } from "fs/promises";
import path from "path";
import { debounceTime } from "rxjs/operators";
import type { MyServersConfig as LegacyConfig } from "./helpers/my-servers-config.js";
import { MyServersConfig } from "./config.entity.js";
import { plainToInstance } from "class-transformer";
import { csvStringToArray } from "./helpers/utils.js";
import { parse as parseIni } from 'ini';

@Injectable()
export class ConnectConfigPersister implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly configService: ConfigService) {}

  private logger = new Logger(ConnectConfigPersister.name);
  get configPath() {
    return path.join(
      this.configService.get("CONFIG_MODULES_HOME")!,
      "connect.json"
    );
  }

  async onModuleDestroy() {
    await this.persist();
  }

  async onModuleInit() {
    this.logger.debug(`Config path: ${this.configPath}`);
    await this.loadOrMigrateConfig();
    // Persist changes to the config.
    const HALF_SECOND = 500;
    this.configService.changes$.pipe(debounceTime(HALF_SECOND)).subscribe({
      next: async ({ newValue, oldValue, path }) => {
        if (path.startsWith("connect.")) {
          this.logger.debug(
            `Config changed: ${path} from ${oldValue} to ${newValue}`
          );
          await this.persist();
        }
      },
      error: (err) => {
        this.logger.error("Error receiving config changes:", err);
      },
    });
  }

  async persist(config = this.configService.get<{ demo: string }>("connect")) {
    const data = JSON.stringify(config, null, 2);
    this.logger.verbose(`Persisting config to ${this.configPath}: ${data}`);
    try {
      await writeFile(this.configPath, data);
      this.logger.verbose(`Config persisted to ${this.configPath}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Error persisting config to '${this.configPath}':`,
        error
      );
      return false;
    }
  }

  /**
   * Validate the config object.
   * @param config - The config object to validate.
   * @returns The validated config instance.
   */
  private validate(config: object) {
    return plainToInstance(MyServersConfig, config);
  }

  /**
   * Load the config from the filesystem, or migrate the legacy config file to the new config format.
   * When unable to load or migrate the config, messages are logged at WARN level, but no other action is taken.
   * @returns true if the config was loaded successfully, false otherwise.
   */
  private async loadOrMigrateConfig() {
    try {
      await this.loadConfig();
      return true;
    } catch (error) {
      this.logger.warn("Error loading config:", error);
    }

    try {
      await this.migrateLegacyConfig();
      return this.persist();
    } catch (error) {
      this.logger.warn("Error migrating legacy config:", error);
    }

    this.logger.error(
      "Failed to load or migrate config from filesystem. Config is not persisted. Using defaults in-memory."
    );
    return false;
  }

  /**
   * Load the JSON config from the filesystem
   * @throws {Error} - If the config file does not exist.
   * @throws {Error} - If the config file is not parse-able.
   * @throws {Error} - If the config file is not valid.
   */
  private async loadConfig(configFilePath = this.configPath) {
    if (!existsSync(configFilePath)) throw new Error(`Config file does not exist at '${configFilePath}'`);
    const config = this.validate(JSON.parse(readFileSync(configFilePath, "utf8")));
    this.configService.set("connect", config);
    this.logger.verbose(`Config loaded from ${configFilePath}`);
  }

  /**
   * Migrate the legacy config file to the new config format.
   * Loads into memory, but does not persist.
   * 
   * @throws {Error} - If the legacy config file does not exist.
   * @throws {Error} - If the legacy config file is not parse-able.
   */
  private async migrateLegacyConfig() {
    const legacyConfig = this.parseLegacyConfig();
    this.configService.set("connect", {
      demo: new Date().toISOString(),
      ...legacyConfig,
    });
  }

  /**
   * Parse the legacy config file and return a new config object.
   * @param filePath - The path to the legacy config file.
   * @returns A new config object.
   * @throws {Error} - If the legacy config file does not exist.
   * @throws {Error} - If the legacy config file is not parse-able.
   */
  private parseLegacyConfig(filePath?: string): MyServersConfig {
    filePath ??= this.configService.get(
      "PATHS_MY_SERVERS_CONFIG",
      "/boot/config/plugins/dynamix.my.servers/myservers.cfg"
    );
    if (!filePath) {
      throw new Error("No legacy config file path provided");
    }
    if (!existsSync(filePath)) {
      throw new Error(`Legacy config file does not exist: ${filePath}`);
    }
    const config = parseIni(readFileSync(filePath, "utf8")) as LegacyConfig;
    return this.validate({
      ...config.api,
      ...config.local,
      ...config.remote,
      extraOrigins: csvStringToArray(config.api.extraOrigins),
    });
  }
}
