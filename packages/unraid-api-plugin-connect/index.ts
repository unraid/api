import { Module, Logger, Inject } from "@nestjs/common";
import { ConfigModule, ConfigService, registerAs } from "@nestjs/config";
import { Resolver, Query } from "@nestjs/graphql";

export const adapter = 'nestjs';

export const graphqlSchemaExtension = async () => `
  type Query {
    health: String
  }
`;

@Resolver()
export class HealthResolver {
  @Query(() => String)
  health() {
    // You can replace the return value with your actual health check logic
    return 'I am healthy!';
  }
}

const config = registerAs("connect", () => ({
  demo: true,
}));

@Module({
  imports: [ConfigModule.forFeature(config)],
  providers: [HealthResolver],
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
    console.log("Connect plugin initialized", this.configService.get('connect'));
  }
}

export const ApiModule = ConnectPluginModule;
