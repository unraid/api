import { Field, InputType, Int } from '@nestjs/graphql';

import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

import { FanControlMode } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fancontrol.model.js';

@InputType()
export class SetFanSpeedInput {
    @Field(() => String, { description: 'Fan ID to control' })
    @IsString()
    fanId!: string;

    @Field(() => Int, { description: 'PWM value (0-255)' })
    @IsInt()
    @Min(0)
    @Max(255)
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
