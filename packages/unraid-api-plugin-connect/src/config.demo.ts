import { Field } from "@nestjs/graphql";

export class ConnectDemoConfig {
  @Field(() => String)
  demo!: string;
}
