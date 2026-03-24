import { Field, Float, InputType, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

import { Node } from '@unraid/shared/graphql.model.js';
import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsBoolean,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    Min,
    ValidateNested,
} from 'class-validator';

export enum FanControlMode {
    MANUAL = 'MANUAL',
    AUTOMATIC = 'AUTOMATIC',
    FIXED = 'FIXED',
    OFF = 'OFF',
}

registerEnumType(FanControlMode, {
    name: 'FanControlMode',
    description: 'Fan control operation mode',
});

export enum FanType {
    CPU = 'CPU',
    CASE_INTAKE = 'CASE_INTAKE',
    CASE_EXHAUST = 'CASE_EXHAUST',
    GPU = 'GPU',
    HDD_CAGE = 'HDD_CAGE',
    RADIATOR = 'RADIATOR',
    CHIPSET = 'CHIPSET',
    PSU = 'PSU',
    CUSTOM = 'CUSTOM',
}

registerEnumType(FanType, {
    name: 'FanType',
    description: 'Type of fan',
});

export enum FanConnectorType {
    PWM_4PIN = 'PWM_4PIN',
    DC_3PIN = 'DC_3PIN',
    MOLEX = 'MOLEX',
    UNKNOWN = 'UNKNOWN',
}

registerEnumType(FanConnectorType, {
    name: 'FanConnectorType',
    description: 'Fan connector type',
});

@ObjectType()
export class FanSpeed {
    @Field(() => Int, { description: 'Current RPM' })
    @IsNumber()
    rpm!: number;

    @Field(() => Float, { description: 'Current PWM duty cycle (0-100%)' })
    @IsNumber()
    pwm!: number;

    @Field(() => Float, { nullable: true, description: 'Target RPM if set' })
    @IsOptional()
    @IsNumber()
    targetRpm?: number;

    @Field(() => Date, { description: 'Timestamp of reading' })
    timestamp!: Date;
}

@ObjectType()
export class FanCurvePoint {
    @Field(() => Float, { description: 'Temperature in Celsius' })
    @IsNumber()
    temperature!: number;

    @Field(() => Float, { description: 'Fan speed percentage (0-100)' })
    @IsNumber()
    speed!: number;
}

@ObjectType()
export class FanProfile {
    @Field(() => String, { description: 'Profile name' })
    @IsString()
    name!: string;

    @Field(() => String, { nullable: true, description: 'Profile description' })
    @IsOptional()
    @IsString()
    description?: string;

    @Field(() => [FanCurvePoint], { description: 'Temperature/speed curve points' })
    @ValidateNested({ each: true })
    @Type(() => FanCurvePoint)
    curvePoints!: FanCurvePoint[];

    @Field(() => String, {
        nullable: true,
        description: 'Temperature sensor ID to use for this profile',
    })
    @IsOptional()
    @IsString()
    temperatureSensorId?: string;

    @Field(() => Float, { description: 'Minimum fan speed percentage', defaultValue: 20 })
    @IsNumber()
    minSpeed!: number;

    @Field(() => Float, { description: 'Maximum fan speed percentage', defaultValue: 100 })
    @IsNumber()
    maxSpeed!: number;
}

@ObjectType({ implements: () => Node })
export class Fan extends Node {
    @Field(() => String, { description: 'Fan name/label' })
    @IsString()
    name!: string;

    @Field(() => FanType, { description: 'Type of fan' })
    @IsEnum(FanType)
    type!: FanType;

    @Field(() => FanConnectorType, { description: 'Connector type' })
    @IsEnum(FanConnectorType)
    connectorType!: FanConnectorType;

    @Field(() => String, { nullable: true, description: 'Physical header location' })
    @IsOptional()
    @IsString()
    header?: string;

    @Field(() => FanSpeed, { description: 'Current fan speed' })
    current!: FanSpeed;

    @Field(() => FanControlMode, { description: 'Current control mode' })
    @IsEnum(FanControlMode)
    mode!: FanControlMode;

    @Field(() => FanProfile, { nullable: true, description: 'Active profile if in automatic mode' })
    @IsOptional()
    activeProfile?: FanProfile;

    @Field(() => Int, { nullable: true, description: 'Minimum RPM (hardware limit)' })
    @IsOptional()
    @IsNumber()
    minRpm?: number;

    @Field(() => Int, { nullable: true, description: 'Maximum RPM (hardware limit)' })
    @IsOptional()
    @IsNumber()
    maxRpm?: number;

    @Field(() => Boolean, { description: 'Whether fan is controllable' })
    @IsBoolean()
    controllable!: boolean;

    @Field(() => Boolean, { description: 'Whether fan is detected/connected' })
    @IsBoolean()
    detected!: boolean;
}

@ObjectType()
export class FanControlSummary {
    @Field(() => Int, { description: 'Total number of fans detected' })
    @IsNumber()
    totalFans!: number;

    @Field(() => Int, { description: 'Number of controllable fans' })
    @IsNumber()
    controllableFans!: number;

    @Field(() => Float, { description: 'Average fan speed percentage' })
    @IsNumber()
    averageSpeed!: number;

    @Field(() => Float, { description: 'Average RPM across all fans' })
    @IsNumber()
    averageRpm!: number;

    @Field(() => [String], {
        nullable: true,
        description: 'Names of fans that may need attention (stopped, failing)',
    })
    @IsOptional()
    fansNeedingAttention?: string[];
}

@ObjectType({ implements: () => Node })
export class FanControlMetrics extends Node {
    @Field(() => [Fan], { description: 'All detected fans' })
    fans!: Fan[];

    @Field(() => [FanProfile], { description: 'Available fan profiles' })
    profiles!: FanProfile[];

    @Field(() => FanControlSummary, { description: 'Fan control summary' })
    summary!: FanControlSummary;
}

@InputType()
export class FanCurvePointInput {
    @Field(() => Float, { description: 'Temperature in Celsius' })
    @IsNumber()
    temperature!: number;

    @Field(() => Float, { description: 'Fan speed percentage (0-100)' })
    @IsNumber()
    @Min(0)
    @Max(100)
    speed!: number;
}

@InputType()
export class CreateFanProfileInput {
    @Field(() => String, { description: 'Profile name' })
    @IsString()
    name!: string;

    @Field(() => String, { nullable: true, description: 'Profile description' })
    @IsOptional()
    @IsString()
    description?: string;

    @Field(() => [FanCurvePointInput], { description: 'Temperature/speed curve points' })
    @ValidateNested({ each: true })
    @ArrayMinSize(1)
    @Type(() => FanCurvePointInput)
    curvePoints!: FanCurvePointInput[];

    @Field(() => String, {
        nullable: true,
        description: 'Temperature sensor ID to use for this profile',
    })
    @IsOptional()
    @IsString()
    temperatureSensorId?: string;

    @Field(() => Float, { description: 'Minimum fan speed percentage', defaultValue: 20 })
    @IsNumber()
    @Min(0)
    @Max(100)
    minSpeed!: number;

    @Field(() => Float, { description: 'Maximum fan speed percentage', defaultValue: 100 })
    @IsNumber()
    @Min(0)
    @Max(100)
    maxSpeed!: number;
}
