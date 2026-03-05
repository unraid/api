import {
    SensorType,
    TemperatureUnit,
} from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature.model.js';

export interface RawTemperatureSensor {
    id: string;
    name: string;
    type: SensorType;
    value: number;
    unit: TemperatureUnit;
}

export interface TemperatureSensorProvider {
    readonly id: string;

    isAvailable(): Promise<boolean>;

    read(): Promise<RawTemperatureSensor[]>;
}
