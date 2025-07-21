import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class UPSConfigInput {
  @Field()
  SERVICE: string;

  @Field()
  UPSCABLE: string;

  @Field({ nullable: true })
  CUSTOMUPSCABLE?: string;

  @Field()
  UPSTYPE: string;

  @Field({ nullable: true })
  DEVICE?: string;

  @Field(() => Int, { nullable: true })
  OVERRIDE_UPS_CAPACITY?: number;

  @Field(() => Int)
  BATTERYLEVEL: number;

  @Field(() => Int)
  MINUTES: number;

  @Field(() => Int)
  TIMEOUT: number;

  @Field()
  KILLUPS: string;
}
