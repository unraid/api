import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    FanControllerProvider,
    pwmEnableToControlMode,
    pwmModeToConnectorType,
    RawFanReading,
} from '@app/unraid-api/graph/resolvers/metrics/fancontrol/controllers/controller.interface.js';
import { HwmonService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/controllers/hwmon.service.js';
import { IpmiFanService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/controllers/ipmi_fan.service.js';
import { FanControlConfigService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fancontrol-config.service.js';
import {
    FanConnectorType,
    FanControlMode,
} from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fancontrol.model.js';
import { FanControlService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fancontrol.service.js';

describe('FanControlService', () => {
    let service: FanControlService;
    let hwmon: Partial<FanControllerProvider>;
    let ipmi: Partial<FanControllerProvider>;
    let configService: FanControlConfigService;

    const mockReading: RawFanReading = {
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
    };

    const mockReading2: RawFanReading = {
        id: 'nct6793:fan2',
        name: 'nct6793 Fan 2',
        rpm: 1200,
        pwmValue: 144,
        pwmEnable: 5,
        pwmMode: 1,
        hasPwmControl: true,
        devicePath: '/sys/class/hwmon/hwmon4',
        fanNumber: 2,
        pwmNumber: 2,
    };

    const mockReadingDisconnected: RawFanReading = {
        id: 'nct6793:fan3',
        name: 'nct6793 Fan 3',
        rpm: 0,
        pwmValue: 77,
        pwmEnable: 1,
        pwmMode: 0,
        hasPwmControl: true,
        devicePath: '/sys/class/hwmon/hwmon4',
        fanNumber: 3,
        pwmNumber: 3,
    };

    beforeEach(() => {
        hwmon = {
            id: 'HwmonService',
            isAvailable: vi.fn().mockResolvedValue(true),
            readAll: vi.fn().mockResolvedValue([mockReading, mockReading2, mockReadingDisconnected]),
            setPwm: vi.fn().mockResolvedValue(undefined),
            setMode: vi.fn().mockResolvedValue(undefined),
            restoreAutomatic: vi.fn().mockResolvedValue(undefined),
        };

        ipmi = {
            id: 'IpmiFanService',
            isAvailable: vi.fn().mockResolvedValue(false),
            readAll: vi.fn().mockResolvedValue([]),
            setPwm: vi.fn().mockResolvedValue(undefined),
            setMode: vi.fn().mockResolvedValue(undefined),
            restoreAutomatic: vi.fn().mockResolvedValue(undefined),
        };

        configService = Object.create(FanControlConfigService.prototype);
        configService.getConfig = vi.fn().mockReturnValue({
            enabled: true,
            control_enabled: false,
            polling_interval: 2000,
            control_method: 'auto',
            safety: {
                min_speed_percent: 20,
                cpu_min_speed_percent: 30,
                max_temp_before_full: 85,
                fan_failure_threshold: 0,
            },
        });

        service = new FanControlService(
            hwmon as unknown as HwmonService,
            ipmi as unknown as IpmiFanService,
            configService
        );
    });

    describe('initialization', () => {
        it('should detect available providers', async () => {
            await service.onModuleInit();
            expect(hwmon.isAvailable).toHaveBeenCalled();
            expect(ipmi.isAvailable).toHaveBeenCalled();
        });

        it('should handle unavailable providers gracefully', async () => {
            vi.mocked(hwmon.isAvailable!).mockResolvedValue(false);
            vi.mocked(ipmi.isAvailable!).mockResolvedValue(false);

            await service.onModuleInit();

            const metrics = await service.getMetrics();
            expect(metrics.fans).toHaveLength(0);
        });
    });

    describe('getMetrics', () => {
        it('should return fan metrics from available providers', async () => {
            await service.onModuleInit();
            const metrics = await service.getMetrics();

            expect(metrics.fans).toHaveLength(3);
            expect(metrics.fans[0].name).toBe('nct6793 Fan 1');
            expect(metrics.fans[0].current.rpm).toBe(800);
        });

        it('should calculate PWM percentage correctly', async () => {
            await service.onModuleInit();
            const metrics = await service.getMetrics();

            const fan1 = metrics.fans[0];
            expect(fan1.current.pwm).toBeCloseTo((168 / 255) * 100, 1);
        });

        it('should identify detected vs disconnected fans', async () => {
            await service.onModuleInit();
            const metrics = await service.getMetrics();

            expect(metrics.fans[0].detected).toBe(true);
            expect(metrics.fans[2].detected).toBe(false);
        });

        it('should build correct summary', async () => {
            await service.onModuleInit();
            const metrics = await service.getMetrics();

            expect(metrics.summary.totalFans).toBe(3);
            expect(metrics.summary.averageRpm).toBeGreaterThan(0);
        });

        it('should return empty metrics when disabled', async () => {
            vi.mocked(configService.getConfig).mockReturnValue({
                enabled: false,
                control_enabled: false,
                polling_interval: 2000,
            });

            await service.onModuleInit();
            const metrics = await service.getMetrics();

            expect(metrics.fans).toHaveLength(0);
        });

        it('should cache results within TTL', async () => {
            await service.onModuleInit();

            await service.getMetrics();
            await service.getMetrics();

            expect(hwmon.readAll).toHaveBeenCalledTimes(1);
        });

        it('should filter NaN RPM readings', async () => {
            vi.mocked(hwmon.readAll!).mockResolvedValue([{ ...mockReading, rpm: NaN }, mockReading2]);

            await service.onModuleInit();
            const metrics = await service.getMetrics();

            expect(metrics.fans).toHaveLength(1);
        });
    });
});

describe('pwmEnableToControlMode', () => {
    it('should map enable=0 to OFF', () => {
        expect(pwmEnableToControlMode(0)).toBe(FanControlMode.OFF);
    });

    it('should map enable=1 to MANUAL', () => {
        expect(pwmEnableToControlMode(1)).toBe(FanControlMode.MANUAL);
    });

    it('should map enable=2-5 to AUTOMATIC', () => {
        expect(pwmEnableToControlMode(2)).toBe(FanControlMode.AUTOMATIC);
        expect(pwmEnableToControlMode(3)).toBe(FanControlMode.AUTOMATIC);
        expect(pwmEnableToControlMode(4)).toBe(FanControlMode.AUTOMATIC);
        expect(pwmEnableToControlMode(5)).toBe(FanControlMode.AUTOMATIC);
    });
});

describe('pwmModeToConnectorType', () => {
    it('should map mode=0 to DC_3PIN', () => {
        expect(pwmModeToConnectorType(0)).toBe(FanConnectorType.DC_3PIN);
    });

    it('should map mode=1 to PWM_4PIN', () => {
        expect(pwmModeToConnectorType(1)).toBe(FanConnectorType.PWM_4PIN);
    });

    it('should map unknown mode to UNKNOWN', () => {
        expect(pwmModeToConnectorType(99)).toBe(FanConnectorType.UNKNOWN);
    });
});
