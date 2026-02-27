import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class OnboardingInternalBootDeviceOption {
    @Field(() => String)
    value!: string;

    @Field(() => String)
    label!: string;

    @Field(() => Int)
    sizeMiB!: number;
}

@ObjectType()
export class OnboardingInternalBootContext {
    @Field(() => String, { nullable: true })
    fsState?: string | null;

    @Field(() => Boolean)
    bootEligible!: boolean;

    @Field(() => [String])
    reservedNames!: string[];

    @Field(() => [String])
    shareNames!: string[];

    @Field(() => [String])
    poolNames!: string[];

    @Field(() => String)
    defaultPoolName!: string;

    @Field(() => Int)
    maxSlots!: number;

    @Field(() => [Int])
    bootSizePresetsMiB!: number[];

    @Field(() => Int)
    defaultBootSizeMiB!: number;

    @Field(() => [OnboardingInternalBootDeviceOption])
    deviceOptions!: OnboardingInternalBootDeviceOption[];
}
