import { registerAs } from "@nestjs/config";
import { Field } from "@nestjs/graphql";

export class ConnectConfig {
  @Field(() => String)
  demo!: string;
}

export const configFeature = registerAs<ConnectConfig>("connect", () => ({
  demo: "true",
}));
