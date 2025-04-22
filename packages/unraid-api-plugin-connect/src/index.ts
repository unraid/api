import { Module, Logger, Inject } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ConnectConfigPersister } from "./config.persistence.js";
import { configFeature } from "./config.entity.js";
import { HealthResolver } from "./connect.resolver.js";

export const adapter = "nestjs";

@Module({
  imports: [ConfigModule.forFeature(configFeature)],
  providers: [HealthResolver, ConnectConfigPersister],
})
class ConnectPluginModule {
  logger = new Logger(ConnectPluginModule.name);

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {}

  onModuleInit() {
    this.logger.log(
      "Connect plugin initialized with %o",
      this.configService.get("connect")
    );
  }
}

export const ApiModule = ConnectPluginModule;
