import { Module, Logger } from "@nestjs/common";
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
    return 'OK';
  }
}

@Module({
  providers: [HealthResolver],
})
class HealthPlugin {
  logger = new Logger(HealthPlugin.name);

  onModuleInit() {
    this.logger.log("Health plugin initialized");
  }
}

export const ApiModule = HealthPlugin;