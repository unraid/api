import { Field, InputType, Int } from '@nestjs/graphql';

import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

import { TemperatureUnit } from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature.model.js';

@InputType()
export class SensorConfigInput {
    @Field({ nullable: true })
    @IsBoolean()
    @IsOptional()
    enabled?: boolean;
}

@InputType()
export class LmSensorsConfigInput extends SensorConfigInput {
    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    config_path?: string;
}

@InputType()
export class IpmiConfigInput extends SensorConfigInput {
    @Field(() => [String], { nullable: true })
    @IsString({ each: true })
    @IsOptional()
    args?: string[];
}

@InputType()
export class TemperatureSensorsConfigInput {
    @Field(() => LmSensorsConfigInput, { nullable: true })
    @ValidateNested()
    @Type(() => LmSensorsConfigInput)
    @IsOptional()
    lm_sensors?: LmSensorsConfigInput;

    @Field(() => SensorConfigInput, { nullable: true })
    @ValidateNested()
    @Type(() => SensorConfigInput)
    @IsOptional()
    smartctl?: SensorConfigInput;

    @Field(() => IpmiConfigInput, { nullable: true })
    @ValidateNested()
    @Type(() => IpmiConfigInput)
    @IsOptional()
    ipmi?: IpmiConfigInput;
}

@InputType()
export class TemperatureThresholdsConfigInput {
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

@InputType()
export class TemperatureHistoryConfigInput {
    @Field(() => Int, { nullable: true })
    @IsNumber()
    @IsOptional()
    max_readings?: number;

    @Field(() => Int, { nullable: true })
    @IsNumber()
    @IsOptional()
    retention_ms?: number;
}

@InputType()
export class TemperatureConfigInput {
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

    @Field(() => TemperatureSensorsConfigInput, { nullable: true })
    @ValidateNested()
    @Type(() => TemperatureSensorsConfigInput)
    @IsOptional()
    sensors?: TemperatureSensorsConfigInput;

    @Field(() => TemperatureThresholdsConfigInput, { nullable: true })
    @ValidateNested()
    @Type(() => TemperatureThresholdsConfigInput)
    @IsOptional()
    thresholds?: TemperatureThresholdsConfigInput;

    @Field(() => TemperatureHistoryConfigInput, { nullable: true })
    @ValidateNested()
    @Type(() => TemperatureHistoryConfigInput)
    @IsOptional()
    history?: TemperatureHistoryConfigInput;
}
