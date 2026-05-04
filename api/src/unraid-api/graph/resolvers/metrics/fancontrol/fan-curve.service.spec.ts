import { describe, expect, it } from 'vitest';

import { FanCurveService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fan-curve.service.js';
import { FanCurvePointConfig } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fancontrol-config.model.js';

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
});
