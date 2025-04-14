import { Module, Logger, Inject, Injectable } from "@nestjs/common";
import { ConfigModule, ConfigService, registerAs } from "@nestjs/config";
import { Resolver, Query, Mutation } from "@nestjs/graphql";
import { existsSync, readFileSync, writeFile } from "fs";
import path from "path";
import { debounceTime } from "rxjs/operators";

export const adapter = "nestjs";

export const graphqlSchemaExtension = async () => `
  type Query {
    health: String
    getDemo: String
  }

  type Mutation {
    setDemo: String!
  }
`;

@Resolver()
export class HealthResolver {
  constructor(private readonly configService: ConfigService) {}

  @Query(() => String)
  health() {
    // You can replace the return value with your actual health check logic
    return "I am healthy!";
  }

  @Query(() => String)
  getDemo() {
    return this.configService.get("connect.demo");
  }

  @Mutation(() => String)
  async setDemo() {
    const newValue = new Date().toISOString();
    this.configService.set("connect.demo", newValue);
    return newValue;
  }
}

const config = registerAs("connect", () => ({
  demo: true,
}));

@Injectable()
class ConnectConfigPersister {
  constructor(private readonly configService: ConfigService) {}

  private logger = new Logger(ConnectConfigPersister.name);
  get configPath() {
    return path.join(
      this.configService.get("CONFIG_MODULES_HOME")!,
      "connect.json"
    );
  }

  onModuleInit() {
    this.logger.log(`Config path: ${this.configPath}`);
      // Load the config, else initialize it by persisting to filesystem.
    if (existsSync(this.configPath)) {
      const config = JSON.parse(readFileSync(this.configPath, "utf8"));
      this.configService.set("connect", config);
      this.logger.verbose(`Config loaded from ${this.configPath}`);
    } else {
      this.logger.verbose(`Config file does not exist. Writing...`);
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
        console.error("Error receiving config changes:", err);
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

@Module({
  imports: [ConfigModule.forFeature(config)],
  providers: [HealthResolver, ConnectConfigPersister],
})
class ConnectPluginModule {
  logger = new Logger(ConnectPluginModule.name);
  private readonly configService: ConfigService;

  /**
   * @param {ConfigService} configService
   */
  constructor(@Inject(ConfigService) configService: ConfigService) {
    this.configService = configService;
  }

  onModuleInit() {
    this.logger.log("Connect plugin initialized");
    console.log(
      "Connect plugin initialized",
      this.configService.get("connect")
    );
  }
}

export const ApiModule = ConnectPluginModule;
