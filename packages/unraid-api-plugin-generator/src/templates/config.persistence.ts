import { Injectable } from "@nestjs/common";
import { ConfigFilePersister } from "@unraid/shared/services/config-file.js"; // npm install @unraid/shared
import { PluginNameConfig } from "./config.entity.js";

@Injectable()
export class PluginNameConfigPersister extends ConfigFilePersister<PluginNameConfig> {
  fileName(): string {
    return "plugin-name.json"; // Use kebab-case for the filename
  }

  configKey(): string {
    return "plugin-name";
  }

  defaultConfig(): PluginNameConfig {
    // Return the default configuration for your plugin
    // This should match the structure defined in your config.entity.ts
    return {} as PluginNameConfig;
  }
}
