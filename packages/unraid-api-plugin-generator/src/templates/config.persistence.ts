import { Logger, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { existsSync, readFileSync, writeFile } from "fs";
import path from "path";
import { debounceTime } from "rxjs/operators";
import { PluginNameConfig } from "./config.entity.js";

@Injectable()
export class PluginNameConfigPersister {
  constructor(private readonly configService: ConfigService) {}

  private logger = new Logger(PluginNameConfigPersister.name);
  
  /** the file path to the config file for this plugin */
  get configPath() {
    return path.join(
      this.configService.get("CONFIG_MODULES_HOME")!, 
      'plugin-name.json' // Use kebab-case for the filename
    );
  }

  onModuleInit() {
    this.logger.debug(`Config path: ${this.configPath}`);
    // Load the config from the file if it exists, otherwise initialize it with defaults.
    if (existsSync(this.configPath)) {
      try {
        const configFromFile = JSON.parse(readFileSync(this.configPath, "utf8"));
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
    const HALF_SECOND = 500;
    this.configService.changes$
      .pipe(debounceTime(HALF_SECOND))
      .subscribe({
        next: ({ newValue, oldValue, path: changedPath }) => {
          // Only persist if the change is within this plugin's config namespace
          if (changedPath.startsWith("plugin-name.") && newValue !== oldValue) {
            this.logger.debug(`Config changed: ${changedPath}`, { newValue, oldValue });
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
    writeFile(this.configPath, data, (err) => {
      if (err) {
        this.logger.error("Error writing config change to disk:", err);
      } else {
        this.logger.verbose(`Config change persisted to ${this.configPath}`);
      }
    });
  }
} 