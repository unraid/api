// Location: api/src/unraid-api/graph/resolvers/metrics/temperature/temperature.model.ts

import { Field, Float, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

import { Node } from '@unraid/shared/graphql.model.js';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export enum TemperatureUnit {
    CELSIUS = 'CELSIUS',
    FAHRENHEIT = 'FAHRENHEIT',
    KELVIN = 'KELVIN',
    RANKINE = 'RANKINE',
}

registerEnumType(TemperatureUnit, {
    name: 'TemperatureUnit',
});

export enum TemperatureStatus {
    NORMAL = 'NORMAL',
    WARNING = 'WARNING',
    CRITICAL = 'CRITICAL',
    UNKNOWN = 'UNKNOWN',
}

registerEnumType(TemperatureStatus, {
    name: 'TemperatureStatus',
});

export enum SensorType {
    CPU_PACKAGE = 'CPU_PACKAGE',
    CPU_CORE = 'CPU_CORE',
    MOTHERBOARD = 'MOTHERBOARD',
    CHIPSET = 'CHIPSET',
    GPU = 'GPU',
    DISK = 'DISK',
    NVME = 'NVME',
    AMBIENT = 'AMBIENT',
    VRM = 'VRM',
    CUSTOM = 'CUSTOM',
}

registerEnumType(SensorType, {
    name: 'SensorType',
    description: 'Type of temperature sensor',
});

@ObjectType()
export class TemperatureReading {
    @Field(() => Float, { description: 'Temperature value' })
    @IsNumber()
    value!: number;

    @Field(() => TemperatureUnit, { description: 'Temperature unit' })
    @IsEnum(TemperatureUnit)
    unit!: TemperatureUnit;

    @Field(() => Date, { description: 'Timestamp of reading' })
    timestamp!: Date;

    @Field(() => TemperatureStatus, { description: 'Temperature status' })
    @IsEnum(TemperatureStatus)
    status!: TemperatureStatus;
}

@ObjectType({ implements: () => Node })
export class TemperatureSensor extends Node {
    @Field(() => String, { description: 'Sensor name' })
    @IsString()
    name!: string;

    @Field(() => SensorType, { description: 'Type of sensor' })
    @IsEnum(SensorType)
    type!: SensorType;

    @Field(() => String, { nullable: true, description: 'Physical location' })
    @IsOptional()
    @IsString()
    location?: string;

    @Field(() => TemperatureReading, { description: 'Current temperature' })
    current!: TemperatureReading;

    @Field(() => TemperatureReading, { nullable: true, description: 'Minimum recorded' })
    @IsOptional()
    min?: TemperatureReading;

    @Field(() => TemperatureReading, { nullable: true, description: 'Maximum recorded' })
    @IsOptional()
    max?: TemperatureReading;

    @Field(() => Float, { nullable: true, description: 'Warning threshold' })
    @IsOptional()
    @IsNumber()
    warning?: number;

    @Field(() => Float, { nullable: true, description: 'Critical threshold' })
    @IsOptional()
    @IsNumber()
    critical?: number;

    @Field(() => [TemperatureReading], {
        nullable: true,
        description: 'Historical readings for this sensor',
    })
    @IsOptional()
    history?: TemperatureReading[];
}

@ObjectType()
export class TemperatureSummary {
    @Field(() => Float, { description: 'Average temperature across all sensors' })
    @IsNumber()
    average!: number;

    @Field(() => TemperatureSensor, { description: 'Hottest sensor' })
    hottest!: TemperatureSensor;

    @Field(() => TemperatureSensor, { description: 'Coolest sensor' })
    coolest!: TemperatureSensor;

    @Field(() => Int, { description: 'Count of sensors at warning level' })
    @IsNumber()
    warningCount!: number;

    @Field(() => Int, { description: 'Count of sensors at critical level' })
    @IsNumber()
    criticalCount!: number;
}

@ObjectType({ implements: () => Node })
export class TemperatureMetrics extends Node {
    @Field(() => [TemperatureSensor], { description: 'All temperature sensors' })
    sensors!: TemperatureSensor[];

    @Field(() => TemperatureSummary, { description: 'Temperature summary' })
    summary!: TemperatureSummary;
}
