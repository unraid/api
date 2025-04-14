import { ConfigService } from "@nestjs/config";
import { Resolver, Query, Mutation } from "@nestjs/graphql";

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
