import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

import { RawFanReading } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/controllers/controller.interface.js';
import { HwmonService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/controllers/hwmon.service.js';
import { FanControlConfigService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fancontrol-config.service.js';
import { FanControlMode } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fancontrol.model.js';
import { TemperatureSensor } from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature.model.js';

interface OriginalState {
    devicePath: string;
    pwmNumber: number;
    pwmEnable: number;
    pwmValue: number;
}

@Injectable()
export class FanSafetyService implements OnModuleDestroy {
    private readonly logger = new Logger(FanSafetyService.name);
    private originalStates = new Map<string, OriginalState>();
    private isEmergencyMode = false;
    private fanFailureCount = 0;

    constructor(
        private readonly hwmonService: HwmonService,
        private readonly configService: FanControlConfigService
    ) {}

    async onModuleDestroy(): Promise<void> {
        if (this.originalStates.size > 0) {
            this.logger.warn('Module destroying — restoring fans to original states');
            await this.restoreAllFans();
        }
    }

    async captureState(
        fanId: string,
        devicePath: string,
        pwmNumber: number,
        existingReading?: Pick<RawFanReading, 'pwmEnable' | 'pwmValue'>
    ): Promise<void> {
        if (this.originalStates.has(fanId)) {
            return;
        }

        const reading =
            existingReading ?? (await this.hwmonService.readAll()).find((r) => r.id === fanId);
        if (reading) {
            this.originalStates.set(fanId, {
                devicePath,
                pwmNumber,
                pwmEnable: reading.pwmEnable,
                pwmValue: reading.pwmValue,
            });
            this.logger.debug(
                `Captured original state for ${fanId}: enable=${reading.pwmEnable}, pwm=${reading.pwmValue}`
            );
        }
    }

    private static readonly MAX_PLAUSIBLE_TEMP_C = 150;

    async checkTemperatureSafety(sensors: TemperatureSensor[]): Promise<boolean> {
        const config = this.configService.getConfig();
        const maxTemp = config.safety?.max_temp_before_full ?? 85;

        for (const sensor of sensors) {
            if (sensor.current.value > FanSafetyService.MAX_PLAUSIBLE_TEMP_C) {
                continue;
            }
            if (sensor.current.value >= maxTemp) {
                this.logger.error(
                    `SAFETY: Sensor "${sensor.name}" at ${sensor.current.value}°C exceeds max_temp_before_full (${maxTemp}°C)`
                );
                await this.emergencyFullSpeed();
                return true;
            }
        }
        return false;
    }

    async checkFanFailure(readings: RawFanReading[]): Promise<boolean> {
        const config = this.configService.getConfig();
        const threshold = config.safety?.fan_failure_threshold ?? 0;
        if (threshold === 0) {
            return false;
        }

        const controllableStopped = readings.filter(
            (r) => r.hasPwmControl && r.pwmEnable === 1 && r.pwmValue > 0 && r.rpm === 0
        );

        if (controllableStopped.length > 0) {
            this.fanFailureCount++;
            this.logger.warn(
                `Fan failure detected: ${controllableStopped.map((r) => r.name).join(', ')} (count: ${this.fanFailureCount}/${threshold})`
            );
            if (this.fanFailureCount >= threshold) {
                this.logger.error('Fan failure threshold exceeded — triggering emergency');
                try {
                    await this.emergencyFullSpeed();
                } catch (err) {
                    this.logger.error(`Failed to set emergency full speed: ${err}`);
                }
                return true;
            }
        } else {
            this.fanFailureCount = 0;
        }
        return false;
    }

    validatePwmValue(value: number): number {
        const config = this.configService.getConfig();
        const minPercent = config.safety?.min_speed_percent ?? 20;
        const minPwm = Math.round((minPercent / 100) * 255);
        return Math.max(minPwm, Math.min(255, Math.round(value)));
    }

    validateCpuFanPwm(value: number): number {
        const config = this.configService.getConfig();
        const minPercent = config.safety?.cpu_min_speed_percent ?? 30;
        const minPwm = Math.round((minPercent / 100) * 255);
        return Math.max(minPwm, Math.min(255, Math.round(value)));
    }

    async restoreAllFans(): Promise<void> {
        this.logger.warn('Restoring all fans to original states');
        const failedFans: string[] = [];
        for (const [fanId, state] of this.originalStates.entries()) {
            try {
                if (state.pwmEnable === 1) {
                    await this.hwmonService.setPwm(state.devicePath, state.pwmNumber, state.pwmValue);
                }
                await this.hwmonService.restoreAutomatic(
                    state.devicePath,
                    state.pwmNumber,
                    state.pwmEnable
                );
                this.logger.log(
                    `Restored fan ${fanId} to enable=${state.pwmEnable}, pwm=${state.pwmValue}`
                );
                this.originalStates.delete(fanId);
            } catch (err) {
                this.logger.error(`Failed to restore fan ${fanId}: ${err}`);
                failedFans.push(fanId);
            }
        }
        if (failedFans.length === 0) {
            this.isEmergencyMode = false;
        } else {
            this.logger.warn(`${failedFans.length} fan(s) failed to restore, staying in emergency mode`);
        }
    }

    async emergencyFullSpeed(): Promise<void> {
        this.logger.error('EMERGENCY: Setting all controllable fans to full speed');
        this.isEmergencyMode = true;

        const readings = await this.hwmonService.readAll();
        for (const reading of readings) {
            if (reading.hasPwmControl) {
                try {
                    await this.captureState(reading.id, reading.devicePath, reading.pwmNumber, reading);
                    await this.hwmonService.setMode(reading.devicePath, reading.pwmNumber, 1);
                    await this.hwmonService.setPwm(reading.devicePath, reading.pwmNumber, 255);
                } catch (err) {
                    this.logger.error(`Failed emergency full-speed for ${reading.id}: ${err}`);
                }
            }
        }
    }

    isInEmergencyMode(): boolean {
        return this.isEmergencyMode;
    }

    validateModeTransition(targetMode: FanControlMode): boolean {
        if (this.isEmergencyMode) {
            return false;
        }
        if (targetMode === FanControlMode.OFF) {
            return false;
        }
        return true;
    }
}
