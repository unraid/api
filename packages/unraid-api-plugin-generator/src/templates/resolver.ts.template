import { Resolver, Query, Mutation } from "@nestjs/graphql";
import { ConfigService } from "@nestjs/config";
import { PluginNameConfig } from "./config.entity.js";

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
    // The config persister will automatically save the changes.
    return newStatus;
  }
} 