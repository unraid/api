import { Injectable, Logger } from '@nestjs/common';

import { HwmonService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/controllers/hwmon.service.js';
import { FanControlConfigService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fancontrol-config.service.js';
import { FanControlMode } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fancontrol.model.js';

interface OriginalState {
    devicePath: string;
    pwmNumber: number;
    pwmEnable: number;
    pwmValue: number;
}

@Injectable()
export class FanSafetyService {
    private readonly logger = new Logger(FanSafetyService.name);
    private originalStates = new Map<string, OriginalState>();
    private isEmergencyMode = false;

    constructor(
        private readonly hwmonService: HwmonService,
        private readonly configService: FanControlConfigService
    ) {}

    async captureState(fanId: string, devicePath: string, pwmNumber: number): Promise<void> {
        if (this.originalStates.has(fanId)) {
            return;
        }

        const readings = await this.hwmonService.readAll();
        const reading = readings.find((r) => r.id === fanId);
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
        for (const [fanId, state] of this.originalStates.entries()) {
            try {
                await this.hwmonService.restoreAutomatic(
                    state.devicePath,
                    state.pwmNumber,
                    state.pwmEnable
                );
                this.logger.log(`Restored fan ${fanId} to enable=${state.pwmEnable}`);
            } catch (err) {
                this.logger.error(`Failed to restore fan ${fanId}: ${err}`);
            }
        }
        this.originalStates.clear();
        this.isEmergencyMode = false;
    }

    async emergencyFullSpeed(): Promise<void> {
        this.logger.error('EMERGENCY: Setting all controllable fans to full speed');
        this.isEmergencyMode = true;

        const readings = await this.hwmonService.readAll();
        for (const reading of readings) {
            if (reading.hasPwmControl) {
                try {
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
