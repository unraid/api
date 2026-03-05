import { Injectable, Logger } from '@nestjs/common';

import { TemperatureConfigService } from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature-config.service.js';
import {
    SensorType,
    TemperatureReading,
} from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature.model.js';

interface SensorMetadata {
    name: string;
    type: SensorType;
}

interface SensorHistory {
    sensorId: string;
    metadata: SensorMetadata;
    readings: TemperatureReading[];
    min?: TemperatureReading;
    max?: TemperatureReading;
}

@Injectable()
export class TemperatureHistoryService {
    private readonly logger = new Logger(TemperatureHistoryService.name);
    private history: Map<string, SensorHistory> = new Map();

    // Configurable limits
    private readonly maxReadingsPerSensor: number;
    private readonly retentionMs: number;

    constructor(private readonly configService: TemperatureConfigService) {
        const config = this.configService.getConfig(false);
        this.maxReadingsPerSensor = config.history?.max_readings ?? 1000;
        this.retentionMs = config.history?.retention_ms ?? 86400000;

        this.logger.log(
            `Temperature history configured: max_readings=${this.maxReadingsPerSensor}, retentionMs=${this.retentionMs}ms`
        );
    }

    /**
     * Record a new reading with metadata
     */
    record(sensorId: string, reading: TemperatureReading, metadata: SensorMetadata): void {
        let sensorHistory = this.history.get(sensorId);

        if (!sensorHistory) {
            sensorHistory = {
                sensorId,
                metadata,
                readings: [],
                min: undefined,
                max: undefined,
            };
            this.history.set(sensorId, sensorHistory);
        }

        // Update metadata (in case name changed)
        sensorHistory.metadata = metadata;

        // Add the reading
        sensorHistory.readings.push(reading);

        // Update min/max
        if (!sensorHistory.min || reading.value < sensorHistory.min.value) {
            sensorHistory.min = reading;
        }
        if (!sensorHistory.max || reading.value > sensorHistory.max.value) {
            sensorHistory.max = reading;
        }

        // Trim old readings
        this.trimOldReadings(sensorHistory);
    }

    /**
     * Get min/max for a sensor
     */
    getMinMax(sensorId: string): { min?: TemperatureReading; max?: TemperatureReading } {
        const history = this.history.get(sensorId);
        return history ? { min: history.min, max: history.max } : {};
    }

    /**
     * Get all historical readings for a sensor
     */
    getHistory(sensorId: string): TemperatureReading[] {
        const history = this.history.get(sensorId);
        return history ? [...history.readings] : [];
    }

    /**
     * Get sensor metadata
     */
    getMetadata(sensorId: string): SensorMetadata | null {
        return this.history.get(sensorId)?.metadata || null;
    }

    /**
     * Get all tracked sensor IDs
     */
    getAllSensorIds(): string[] {
        return Array.from(this.history.keys());
    }

    /**
     * Get the most recent reading across all sensors
     */
    getMostRecentReading(): TemperatureReading | null {
        let newest: TemperatureReading | null = null;

        for (const sensorHistory of this.history.values()) {
            if (sensorHistory.readings.length === 0) continue;

            const lastReading = sensorHistory.readings[sensorHistory.readings.length - 1];

            if (!newest || lastReading.timestamp > newest.timestamp) {
                newest = lastReading;
            }
        }

        return newest;
    }

    /**
     * Get statistics
     */
    getStats(): { totalSensors: number; totalReadings: number } {
        let totalReadings = 0;

        for (const history of this.history.values()) {
            totalReadings += history.readings.length;
        }

        return {
            totalSensors: this.history.size,
            totalReadings,
        };
    }

    /**
     * Clear history
     */
    clear(sensorId?: string): void {
        if (sensorId) {
            this.history.delete(sensorId);
        } else {
            this.history.clear();
        }
    }

    // ============================
    // Private Methods
    // ============================

    private trimOldReadings(sensorHistory: SensorHistory): void {
        const now = Date.now();
        const cutoffTime = new Date(now - this.retentionMs);

        // Remove readings older than retention period
        sensorHistory.readings = sensorHistory.readings.filter((r) => r.timestamp >= cutoffTime);

        // Keep only maxReadingsPerSensor most recent readings
        if (sensorHistory.readings.length > this.maxReadingsPerSensor) {
            sensorHistory.readings = sensorHistory.readings.slice(-this.maxReadingsPerSensor);
        }

        // Recalculate min/max if we trimmed
        if (sensorHistory.readings.length > 0) {
            this.recalculateMinMax(sensorHistory);
        } else {
            sensorHistory.min = undefined;
            sensorHistory.max = undefined;
        }
    }

    private recalculateMinMax(sensorHistory: SensorHistory): void {
        if (sensorHistory.readings.length === 0) {
            sensorHistory.min = undefined;
            sensorHistory.max = undefined;
            return;
        }

        let min = sensorHistory.readings[0];
        let max = sensorHistory.readings[0];

        for (const reading of sensorHistory.readings) {
            if (reading.value < min.value) {
                min = reading;
            }
            if (reading.value > max.value) {
                max = reading;
            }
        }

        sensorHistory.min = min;
        sensorHistory.max = max;
    }
}
