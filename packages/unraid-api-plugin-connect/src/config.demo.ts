import { Field } from "@nestjs/graphql";

export class ConnectConfig {
  @Field(() => String)
  demo!: string;
}
