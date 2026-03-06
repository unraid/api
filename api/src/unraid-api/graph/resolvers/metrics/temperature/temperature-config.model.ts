import { Field, Int, ObjectType } from '@nestjs/graphql';

import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

import { TemperatureUnit } from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature.model.js';

@ObjectType()
export class SensorConfig {
    @Field({ nullable: true })
    @IsBoolean()
    @IsOptional()
    enabled?: boolean;
}

@ObjectType()
export class LmSensorsConfig extends SensorConfig {
    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    config_path?: string;
}

@ObjectType()
export class IpmiConfig extends SensorConfig {
    @Field(() => [String], { nullable: true })
    @IsString({ each: true })
    @IsOptional()
    args?: string[];
}

@ObjectType()
export class TemperatureSensorsConfig {
    @Field(() => LmSensorsConfig, { nullable: true })
    @ValidateNested()
    @Type(() => LmSensorsConfig)
    @IsOptional()
    lm_sensors?: LmSensorsConfig;

    @Field(() => SensorConfig, { nullable: true })
    @ValidateNested()
    @Type(() => SensorConfig)
    @IsOptional()
    smartctl?: SensorConfig;

    @Field(() => IpmiConfig, { nullable: true })
    @ValidateNested()
    @Type(() => IpmiConfig)
    @IsOptional()
    ipmi?: IpmiConfig;
}

@ObjectType()
export class TemperatureThresholdsConfig {
    @Field(() => Int, { nullable: true })
    @IsNumber()
    @IsOptional()
    cpu_warning?: number;

    @Field(() => Int, { nullable: true })
    @IsNumber()
    @IsOptional()
    cpu_critical?: number;

    @Field(() => Int, { nullable: true })
    @IsNumber()
    @IsOptional()
    disk_warning?: number;

    @Field(() => Int, { nullable: true })
    @IsNumber()
    @IsOptional()
    disk_critical?: number;

    @Field(() => Int, { nullable: true })
    @IsNumber()
    @IsOptional()
    warning?: number;

    @Field(() => Int, { nullable: true })
    @IsNumber()
    @IsOptional()
    critical?: number;
}

@ObjectType()
export class TemperatureHistoryConfig {
    @Field(() => Int, { nullable: true })
    @IsNumber()
    @IsOptional()
    max_readings?: number;

    @Field(() => Int, { nullable: true })
    @IsNumber()
    @IsOptional()
    retention_ms?: number;
}

@ObjectType()
export class TemperatureConfig {
    @Field({ nullable: true })
    @IsBoolean()
    @IsOptional()
    enabled?: boolean;

    @Field(() => Int, { nullable: true })
    @IsNumber()
    @IsOptional()
    polling_interval?: number;

    @Field(() => TemperatureUnit, { nullable: true })
    @IsEnum(TemperatureUnit)
    @IsOptional()
    default_unit?: TemperatureUnit;

    @Field(() => TemperatureSensorsConfig, { nullable: true })
    @ValidateNested()
    @Type(() => TemperatureSensorsConfig)
    @IsOptional()
    sensors?: TemperatureSensorsConfig;

    @Field(() => TemperatureThresholdsConfig, { nullable: true })
    @ValidateNested()
    @Type(() => TemperatureThresholdsConfig)
    @IsOptional()
    thresholds?: TemperatureThresholdsConfig;

    @Field(() => TemperatureHistoryConfig, { nullable: true })
    @ValidateNested()
    @Type(() => TemperatureHistoryConfig)
    @IsOptional()
    history?: TemperatureHistoryConfig;
}
