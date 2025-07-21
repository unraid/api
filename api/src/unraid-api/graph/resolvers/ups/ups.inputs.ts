import { Field, InputType, Int, Float } from '@nestjs/graphql';

@InputType()
export class UPSConfigInput {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  model: string;
}
