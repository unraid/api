import { Resolver, Query, Mutation } from "@nestjs/graphql";
import { ConfigService } from "@nestjs/config";

@Resolver()
export class PluginNameResolver {
  constructor(private readonly configService: ConfigService) {}

  @Query(() => String)
  async PluginNameStatus() {
    // Example query: Fetch a value from the config
    return this.configService.get("plugin-name.enabled", true) ? "Enabled" : "Disabled";
  }

  @Mutation(() => Boolean)
  async togglePluginNameStatus() {
    // Example mutation: Update a value in the config
    const currentStatus = this.configService.get("plugin-name.enabled", true);
    const newStatus = !currentStatus;
    this.configService.set("plugin-name.enabled", newStatus);
    // This starter mutation is intentionally process-local. Add a host-backed
    // persistence service before treating this value as durable configuration.
    return newStatus;
  }
}
