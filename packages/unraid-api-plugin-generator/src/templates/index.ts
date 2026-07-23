import { Module, Logger, Inject } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { configFeature } from "./config.entity.js";
import { PluginNameResolver } from "./plugin-name.resolver.js";

export const adapter = "nestjs";

@Module({
  imports: [ConfigModule.forFeature(configFeature)],
  providers: [PluginNameResolver],
})
class PluginNamePluginModule {
  logger = new Logger(PluginNamePluginModule.name);

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {}

  onModuleInit() {
    this.logger.log(
      "PluginName plugin initialized with %o",
      this.configService.get("plugin-name")
    );
  }
}

export const ApiModule = PluginNamePluginModule; 
