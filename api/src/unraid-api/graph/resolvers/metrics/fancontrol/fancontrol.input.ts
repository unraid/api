import { Field, Float, InputType, Int } from '@nestjs/graphql';

import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

import { FanControlMode } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fancontrol.model.js';

@InputType()
export class SetFanSpeedInput {
    @Field(() => String, { description: 'Fan ID to control' })
    @IsString()
    fanId!: string;

    @Field(() => Int, { description: 'PWM value (0-255)' })
    @IsNumber()
    pwmValue!: number;
}

@InputType()
export class SetFanModeInput {
    @Field(() => String, { description: 'Fan ID to control' })
    @IsString()
    fanId!: string;

    @Field(() => FanControlMode, { description: 'Target control mode' })
    @IsEnum(FanControlMode)
    mode!: FanControlMode;
}

@InputType()
export class SetFanProfileInput {
    @Field(() => String, { description: 'Fan ID to assign profile to' })
    @IsString()
    fanId!: string;

    @Field(() => String, { description: 'Profile name to apply' })
    @IsString()
    profileName!: string;

    @Field(() => String, {
        nullable: true,
        description: 'Temperature sensor ID for the curve',
    })
    @IsOptional()
    @IsString()
    temperatureSensorId?: string;
}
