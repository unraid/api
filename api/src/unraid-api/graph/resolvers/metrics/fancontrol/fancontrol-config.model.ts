import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';

import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

@ObjectType()
export class FanControlSafetyConfig {
    @Field(() => Float, { nullable: true })
    @IsNumber()
    @IsOptional()
    min_speed_percent?: number;

    @Field(() => Float, { nullable: true })
    @IsNumber()
    @IsOptional()
    cpu_min_speed_percent?: number;

    @Field(() => Float, { nullable: true })
    @IsNumber()
    @IsOptional()
    max_temp_before_full?: number;

    @Field(() => Int, { nullable: true })
    @IsNumber()
    @IsOptional()
    fan_failure_threshold?: number;
}

@ObjectType()
export class FanCurvePointConfig {
    @Field(() => Float)
    @IsNumber()
    temp!: number;

    @Field(() => Float)
    @IsNumber()
    speed!: number;
}

@ObjectType()
export class FanProfileConfig {
    @Field(() => String, { nullable: true })
    @IsString()
    @IsOptional()
    description?: string;

    @Field(() => [FanCurvePointConfig])
    @ValidateNested({ each: true })
    @Type(() => FanCurvePointConfig)
    curve!: FanCurvePointConfig[];
}

@ObjectType()
export class FanZoneConfig {
    @Field(() => [String])
    @IsString({ each: true })
    fans!: string[];

    @Field(() => String)
    @IsString()
    sensor!: string;

    @Field(() => String)
    @IsString()
    profile!: string;
}

@ObjectType()
export class FanControlConfig {
    @Field({ nullable: true })
    @IsBoolean()
    @IsOptional()
    enabled?: boolean;

    @Field({ nullable: true })
    @IsBoolean()
    @IsOptional()
    control_enabled?: boolean;

    @Field(() => Int, { nullable: true })
    @IsNumber()
    @IsOptional()
    polling_interval?: number;

    @Field(() => String, { nullable: true })
    @IsString()
    @IsOptional()
    control_method?: string;

    @Field(() => FanControlSafetyConfig, { nullable: true })
    @ValidateNested()
    @Type(() => FanControlSafetyConfig)
    @IsOptional()
    safety?: FanControlSafetyConfig;
}

@InputType()
export class FanControlSafetyInput {
    @Field(() => Float, { nullable: true })
    @IsNumber()
    @IsOptional()
    min_speed_percent?: number;

    @Field(() => Float, { nullable: true })
    @IsNumber()
    @IsOptional()
    cpu_min_speed_percent?: number;

    @Field(() => Float, { nullable: true })
    @IsNumber()
    @IsOptional()
    max_temp_before_full?: number;

    @Field(() => Int, { nullable: true })
    @IsNumber()
    @IsOptional()
    fan_failure_threshold?: number;
}

@InputType()
export class UpdateFanControlConfigInput {
    @Field({ nullable: true })
    @IsBoolean()
    @IsOptional()
    enabled?: boolean;

    @Field({ nullable: true })
    @IsBoolean()
    @IsOptional()
    control_enabled?: boolean;

    @Field(() => Int, { nullable: true })
    @IsNumber()
    @IsOptional()
    polling_interval?: number;

    @Field(() => FanControlSafetyInput, { nullable: true })
    @ValidateNested()
    @Type(() => FanControlSafetyInput)
    @IsOptional()
    safety?: FanControlSafetyInput;
}
