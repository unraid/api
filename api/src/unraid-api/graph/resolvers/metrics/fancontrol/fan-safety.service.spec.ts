import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HwmonService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/controllers/hwmon.service.js';
import { FanSafetyService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fan-safety.service.js';
import { FanControlConfigService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fancontrol-config.service.js';
import { FanControlMode } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fancontrol.model.js';

describe('FanSafetyService', () => {
    let service: FanSafetyService;
    let hwmon: Partial<HwmonService>;
    let configService: FanControlConfigService;

    beforeEach(() => {
        hwmon = {
            readAll: vi.fn().mockResolvedValue([
                {
                    id: 'nct6793:fan1',
                    name: 'nct6793 Fan 1',
                    rpm: 800,
                    pwmValue: 168,
                    pwmEnable: 5,
                    pwmMode: 1,
                    hasPwmControl: true,
                    devicePath: '/sys/class/hwmon/hwmon4',
                    fanNumber: 1,
                    pwmNumber: 1,
                },
            ]),
            setMode: vi.fn().mockResolvedValue(undefined),
            setPwm: vi.fn().mockResolvedValue(undefined),
            restoreAutomatic: vi.fn().mockResolvedValue(undefined),
        };

        configService = Object.create(FanControlConfigService.prototype);
        configService.getConfig = vi.fn().mockReturnValue({
            enabled: true,
            control_enabled: true,
            safety: {
                min_speed_percent: 20,
                cpu_min_speed_percent: 30,
                max_temp_before_full: 85,
                fan_failure_threshold: 0,
            },
        });

        service = new FanSafetyService(hwmon as unknown as HwmonService, configService);
    });

    describe('validatePwmValue', () => {
        it('should enforce minimum speed percentage', () => {
            const result = service.validatePwmValue(10);
            const minPwm = Math.round((20 / 100) * 255);
            expect(result).toBe(minPwm);
        });

        it('should clamp to 255 max', () => {
            expect(service.validatePwmValue(300)).toBe(255);
        });

        it('should pass through valid values above minimum', () => {
            expect(service.validatePwmValue(200)).toBe(200);
        });
    });

    describe('validateCpuFanPwm', () => {
        it('should enforce higher minimum for CPU fans', () => {
            const result = service.validateCpuFanPwm(10);
            const minPwm = Math.round((30 / 100) * 255);
            expect(result).toBe(minPwm);
        });
    });

    describe('validateModeTransition', () => {
        it('should prevent transition to OFF', () => {
            const result = service.validateModeTransition(FanControlMode.OFF);
            expect(result).toBe(false);
        });

        it('should allow transition to MANUAL', () => {
            const result = service.validateModeTransition(FanControlMode.MANUAL);
            expect(result).toBe(true);
        });

        it('should block all transitions in emergency mode', async () => {
            await service.emergencyFullSpeed();
            const result = service.validateModeTransition(FanControlMode.AUTOMATIC);
            expect(result).toBe(false);
        });
    });

    describe('emergencyFullSpeed', () => {
        it('should set emergency mode flag', async () => {
            expect(service.isInEmergencyMode()).toBe(false);
            await service.emergencyFullSpeed();
            expect(service.isInEmergencyMode()).toBe(true);
        });
    });

    describe('captureState', () => {
        it('should store the original fan state', async () => {
            await service.captureState('nct6793:fan1', '/sys/class/hwmon/hwmon4', 1);
            expect(hwmon.readAll).toHaveBeenCalled();
        });

        it('should not re-capture already captured state', async () => {
            await service.captureState('nct6793:fan1', '/sys/class/hwmon/hwmon4', 1);
            await service.captureState('nct6793:fan1', '/sys/class/hwmon/hwmon4', 1);
            expect(hwmon.readAll).toHaveBeenCalledTimes(1);
        });
    });

    describe('restoreAllFans', () => {
        it('should restore all captured fan states', async () => {
            await service.captureState('nct6793:fan1', '/sys/class/hwmon/hwmon4', 1);
            await service.restoreAllFans();
            expect(hwmon.restoreAutomatic).toHaveBeenCalled();
        });

        it('should clear emergency mode after restore', async () => {
            await service.emergencyFullSpeed();
            expect(service.isInEmergencyMode()).toBe(true);
            await service.restoreAllFans();
            expect(service.isInEmergencyMode()).toBe(false);
        });
    });
});
