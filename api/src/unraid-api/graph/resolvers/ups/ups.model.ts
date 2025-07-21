import { Field, ObjectType, ID, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class UPSBattery {
  @Field(() => Int)
  chargeLevel: number;

  @Field(() => Int)
  estimatedRuntime: number;

  @Field()
  health: string;
}

@ObjectType()
export class UPSPower {
  @Field(() => Float)
  inputVoltage: number;

  @Field(() => Float)
  outputVoltage: number;

  @Field(() => Int)
  loadPercentage: number;
}

@ObjectType()
export class UPSDevice {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  model: string;

  @Field()
  status: string;

  @Field(() => UPSBattery)
  battery: UPSBattery;

  @Field(() => UPSPower)
  power: UPSPower;
}
