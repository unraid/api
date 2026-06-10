import { describe, expect, it, vi } from 'vitest';

import { HwmonService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/controllers/hwmon.service.js';
import { FanCurveService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fan-curve.service.js';
import { FanSafetyService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fan-safety.service.js';
import {
    FanControlConfig,
    FanCurvePointConfig,
} from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fancontrol-config.model.js';
import { FanControlConfigService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fancontrol-config.service.js';
import { TemperatureService } from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature.service.js';

const interpolateSpeed = FanCurveService.prototype.interpolateSpeed;

describe('Fan Curve Interpolation', () => {
    const balancedCurve: FanCurvePointConfig[] = [
        { temp: 30, speed: 30 },
        { temp: 45, speed: 45 },
        { temp: 60, speed: 65 },
        { temp: 70, speed: 80 },
        { temp: 80, speed: 100 },
    ];

    it('should return minimum speed below lowest temp', () => {
        expect(interpolateSpeed(balancedCurve, 20)).toBe(30);
    });

    it('should return maximum speed above highest temp', () => {
        expect(interpolateSpeed(balancedCurve, 90)).toBe(100);
    });

    it('should return exact value at curve point', () => {
        expect(interpolateSpeed(balancedCurve, 45)).toBe(45);
    });

    it('should interpolate linearly between points', () => {
        const speed = interpolateSpeed(balancedCurve, 37.5);
        expect(speed).toBe(37.5);
    });

    it('should handle single point curve', () => {
        expect(interpolateSpeed([{ temp: 50, speed: 60 }], 40)).toBe(60);
        expect(interpolateSpeed([{ temp: 50, speed: 60 }], 70)).toBe(60);
    });

    it('should handle empty curve', () => {
        expect(interpolateSpeed([], 50)).toBe(100);
    });

    it('should handle unsorted curve points', () => {
        const unsorted = [
            { temp: 60, speed: 65 },
            { temp: 30, speed: 30 },
            { temp: 80, speed: 100 },
        ];
        expect(interpolateSpeed(unsorted, 45)).toBe(47.5);
    });

    it('should not produce NaN or Infinity for duplicate temperature points', () => {
        const duplicates = [
            { temp: 30, speed: 20 },
            { temp: 50, speed: 40 },
            { temp: 50, speed: 60 },
            { temp: 70, speed: 100 },
        ];
        expect(Number.isFinite(interpolateSpeed(duplicates, 50))).toBe(true);
        expect(Number.isFinite(interpolateSpeed(duplicates, 55))).toBe(true);
        expect(
            Number.isFinite(
                interpolateSpeed(
                    [
                        { temp: 50, speed: 40 },
                        { temp: 50, speed: 60 },
                    ],
                    50
                )
            )
        ).toBe(true);
    });
});

describe('Fan Curve Bootstrap', () => {
    const createService = (config: Partial<FanControlConfig>) =>
        new FanCurveService(
            {} as HwmonService,
            {} as TemperatureService,
            {} as FanSafetyService,
            { getConfig: vi.fn().mockReturnValue(config) } as unknown as FanControlConfigService
        );

    const zones = [{ fans: ['nct6793:fan2'], sensor: 'cpu', profile: 'balanced' }];

    it('should resume the curve engine at bootstrap when control is enabled with zones', async () => {
        const service = createService({ control_enabled: true, zones });
        const startSpy = vi.spyOn(service, 'start').mockResolvedValue(undefined);

        await service.onApplicationBootstrap();

        expect(startSpy).toHaveBeenCalledWith(zones);
    });

    it('should not start the curve engine at bootstrap when control is disabled', async () => {
        const service = createService({ control_enabled: false, zones });
        const startSpy = vi.spyOn(service, 'start').mockResolvedValue(undefined);

        await service.onApplicationBootstrap();

        expect(startSpy).not.toHaveBeenCalled();
    });

    it('should not start the curve engine at bootstrap when no zones are configured', async () => {
        const service = createService({ control_enabled: true, zones: [] });
        const startSpy = vi.spyOn(service, 'start').mockResolvedValue(undefined);

        await service.onApplicationBootstrap();

        expect(startSpy).not.toHaveBeenCalled();
    });

    it('should not throw at bootstrap when starting the curve engine fails', async () => {
        const service = createService({ control_enabled: true, zones });
        vi.spyOn(service, 'start').mockRejectedValue(new Error('hwmon unavailable'));

        await expect(service.onApplicationBootstrap()).resolves.toBeUndefined();
    });
});
