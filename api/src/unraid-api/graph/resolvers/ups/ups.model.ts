import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UPSBattery {
    @Field(() => Int)
    chargeLevel!: number;

    @Field(() => Int)
    estimatedRuntime!: number;

    @Field()
    health!: string;
}

@ObjectType()
export class UPSPower {
    @Field(() => Float)
    inputVoltage!: number;

    @Field(() => Float)
    outputVoltage!: number;

    @Field(() => Int)
    loadPercentage!: number;
}

@ObjectType()
export class UPSDevice {
    @Field(() => ID)
    id!: string;

    @Field()
    name!: string;

    @Field()
    model!: string;

    @Field()
    status!: string;

    @Field(() => UPSBattery)
    battery!: UPSBattery;

    @Field(() => UPSPower)
    power!: UPSPower;
}

@ObjectType()
export class UPSConfiguration {
    @Field({ nullable: true })
    service?: string;

    @Field({ nullable: true })
    upsCable?: string;

    @Field({ nullable: true })
    customUpsCable?: string;

    @Field({ nullable: true })
    upsType?: string;

    @Field({ nullable: true })
    device?: string;

    @Field(() => Int, { nullable: true })
    overrideUpsCapacity?: number;

    @Field(() => Int, { nullable: true })
    batteryLevel?: number;

    @Field(() => Int, { nullable: true })
    minutes?: number;

    @Field(() => Int, { nullable: true })
    timeout?: number;

    @Field({ nullable: true })
    killUps?: string;

    @Field({ nullable: true })
    nisIp?: string;

    @Field({ nullable: true })
    netServer?: string;

    @Field({ nullable: true })
    upsName?: string;

    @Field({ nullable: true })
    modelName?: string;
}
