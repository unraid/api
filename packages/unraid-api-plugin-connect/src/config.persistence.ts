import { Logger, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { existsSync, readFileSync, writeFile } from "fs";
import path from "path";
import { debounceTime } from "rxjs/operators";

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
      this.persist();
    }

    // Persist changes to the config.
    this.configService.changes$.pipe(debounceTime(500)).subscribe({
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
    writeFile(this.configPath, data, (err) => {
      if (err) {
        this.logger.error("Error writing config change to disk:", err);
      } else {
        this.logger.verbose(`Config change persisted to ${this.configPath}`);
      }
    });
  }
}
