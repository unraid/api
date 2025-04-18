import { Logger, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { existsSync, readFileSync, writeFile } from "fs";
import path from "path";
import { debounceTime } from "rxjs/operators";
import { parseConfig } from "./helpers/parse-ini-config.js";
import type { MyServersConfig as LegacyConfig } from "./helpers/my-servers-config.js";
import { MyServersConfig } from "./config.entity.js";
import { plainToInstance } from "class-transformer";
import { csvStringToArray } from "./helpers/utils.js";

@Injectable()
export class ConnectConfigPersister {
  constructor(private readonly configService: ConfigService) {}

  private logger = new Logger(ConnectConfigPersister.name);
  get configPath() {
    return path.join(
      this.configService.get("CONFIG_MODULES_HOME")!,
      "connect.json"
    );
  }

  onModuleInit() {
    this.logger.debug(`Config path: ${this.configPath}`);
    // Load the config, else initialize it by persisting to filesystem.
    if (existsSync(this.configPath)) {
      const config = JSON.parse(readFileSync(this.configPath, "utf8"));
      this.configService.set("connect", config);
      this.logger.verbose(`Config loaded from ${this.configPath}`);
    } else {
      this.logger.log(`Config file does not exist. Writing...`);
      const legacyConfig = this.parseLegacyConfig();
      this.configService.set("connect", {
        demo: new Date().toISOString(),
        ...legacyConfig,
      });
      this.persist();
    }

    // Persist changes to the config.
    const HALF_SECOND = 500;
    this.configService.changes$.pipe(debounceTime(HALF_SECOND)).subscribe({
      next: ({ newValue, oldValue, path }) => {
        if (newValue !== oldValue) {
          this.logger.debug(`Config changed: ${path}`, { newValue, oldValue });
          this.persist();
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
    writeFile(this.configPath, data, (err) => {
      if (err) {
        this.logger.error("Error writing config change to disk:", err);
      } else {
        this.logger.verbose(`Config change persisted to ${this.configPath}`);
      }
    });
  }
  private parseLegacyConfig(filePath?: string): MyServersConfig {
    filePath ??= this.configService.get(
      "PATHS_MY_SERVERS_CONFIG",
      "/boot/config/plugins/dynamix.my.servers/myservers.cfg"
    );
    if (!filePath) {
      throw new Error("No legacy config file path provided");
    }
    const config = parseConfig<LegacyConfig>({ filePath, type: "ini" });
    return plainToInstance(MyServersConfig, {
      ...config.api,
      ...config.local,
      ...config.remote,
      extraOrigins: csvStringToArray(config.api.extraOrigins),
    });
  }
}
