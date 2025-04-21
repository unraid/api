import { registerAs } from "@nestjs/config";
import { Field, ObjectType } from "@nestjs/graphql";
import { Exclude, Expose } from "class-transformer";
import { IsBoolean } from "class-validator";

@Exclude() // Exclude properties by default
@ObjectType()
export class PluginNameConfig {
  @Expose() // Expose this property for transformation
  @Field(() => Boolean, { description: "Whether the plugin is enabled" })
  @IsBoolean()
  enabled!: boolean;
}

// This function provides the default config and registers it under the 'plugin-name' key.
export const configFeature = registerAs<PluginNameConfig>("plugin-name", () => {
  return {
    enabled: true,
  };
});
