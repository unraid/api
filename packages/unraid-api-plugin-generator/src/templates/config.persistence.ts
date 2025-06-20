import { Logger, Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { existsSync, readFileSync } from "fs";
import { writeFile } from "fs/promises";
import path from "path";
import { debounceTime } from "rxjs/operators";
import { PluginNameConfig } from "./config.entity.js";

@Injectable()
export class PluginNameConfigPersister implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  private logger = new Logger(PluginNameConfigPersister.name);

  /** the file path to the config file for this plugin */
  get configPath() {
    return path.join(
      this.configService.get("PATHS_CONFIG_MODULES")!,
      "plugin-name.json" // Use kebab-case for the filename
    );
  }

  onModuleInit() {
    this.logger.debug(`Config path: ${this.configPath}`);
    // Load the config from the file if it exists, otherwise initialize it with defaults.
    if (existsSync(this.configPath)) {
      try {
        const configFromFile = JSON.parse(
          readFileSync(this.configPath, "utf8")
        );
        this.configService.set("plugin-name", configFromFile);
        this.logger.verbose(`Config loaded from ${this.configPath}`);
      } catch (error) {
        this.logger.error(`Error reading or parsing config file at ${this.configPath}. Using defaults.`, error);
        // If loading fails, ensure default config is set and persisted
        this.persist();
      }
    } else {
      this.logger.log(`Config file ${this.configPath} does not exist. Writing default config...`);
      // Persist the default configuration provided by configFeature
      this.persist();
    }

    // Automatically persist changes to the config file after a short delay.
    this.configService.changes$.pipe(debounceTime(25)).subscribe({
      next: ({ newValue, oldValue, path: changedPath }) => {
        // Only persist if the change is within this plugin's config namespace
        if (changedPath.startsWith("plugin-name.") && newValue !== oldValue) {
          this.logger.debug(`Config changed: ${changedPath} from ${oldValue} to ${newValue}`);
          // Persist the entire config object for this plugin
          this.persist();
        }
      },
      error: (err) => {
        this.logger.error("Error subscribing to config changes:", err);
      },
    });
  }

  async persist(config = this.configService.get<PluginNameConfig>("plugin-name")) {
    const data = JSON.stringify(config, null, 2);
    this.logger.verbose(`Persisting config to ${this.configPath}: ${data}`);
    try {
      await writeFile(this.configPath, data);
      this.logger.verbose(`Config change persisted to ${this.configPath}`);
    } catch (error) {
      this.logger.error(`Error persisting config to '${this.configPath}':`, error);
    }
  }
}
