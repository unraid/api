import { Field, InputType, Int, PartialType } from '@nestjs/graphql';

import { TemperatureUnit } from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature.model.js';

@InputType()
export class SensorConfigInput {
    @Field({ nullable: true })
    enabled?: boolean;
}

@InputType()
export class LmSensorsConfigInput extends SensorConfigInput {
    @Field({ nullable: true })
    config_path?: string;
}

@InputType()
export class IpmiConfigInput extends SensorConfigInput {
    @Field(() => [String], { nullable: true })
    args?: string[];
}

@InputType()
export class TemperatureSensorsConfigInput {
    @Field(() => LmSensorsConfigInput, { nullable: true })
    lm_sensors?: LmSensorsConfigInput;

    @Field(() => SensorConfigInput, { nullable: true })
    smartctl?: SensorConfigInput;

    @Field(() => IpmiConfigInput, { nullable: true })
    ipmi?: IpmiConfigInput;
}

@InputType()
export class TemperatureThresholdsConfigInput {
    @Field(() => Int, { nullable: true })
    cpu_warning?: number;

    @Field(() => Int, { nullable: true })
    cpu_critical?: number;

    @Field(() => Int, { nullable: true })
    disk_warning?: number;

    @Field(() => Int, { nullable: true })
    disk_critical?: number;

    @Field(() => Int, { nullable: true })
    warning?: number;

    @Field(() => Int, { nullable: true })
    critical?: number;
}

@InputType()
export class TemperatureHistoryConfigInput {
    @Field(() => Int, { nullable: true })
    max_readings?: number;

    @Field(() => Int, { nullable: true })
    retention_ms?: number;
}

@InputType()
export class TemperatureConfigInput {
    @Field({ nullable: true })
    enabled?: boolean;

    @Field(() => Int, { nullable: true })
    polling_interval?: number;

    @Field(() => TemperatureUnit, { nullable: true })
    default_unit?: TemperatureUnit;

    @Field(() => TemperatureSensorsConfigInput, { nullable: true })
    sensors?: TemperatureSensorsConfigInput;

    @Field(() => TemperatureThresholdsConfigInput, { nullable: true })
    thresholds?: TemperatureThresholdsConfigInput;

    @Field(() => TemperatureHistoryConfigInput, { nullable: true })
    history?: TemperatureHistoryConfigInput;
}
