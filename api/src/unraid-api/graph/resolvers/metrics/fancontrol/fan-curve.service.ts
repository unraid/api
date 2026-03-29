import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

import { HwmonService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/controllers/hwmon.service.js';
import { FanSafetyService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fan-safety.service.js';
import {
    FanCurvePointConfig,
    FanProfileConfig,
    FanZoneConfig,
} from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fancontrol-config.model.js';
import { FanControlConfigService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fancontrol-config.service.js';
import { TemperatureService } from '@app/unraid-api/graph/resolvers/metrics/temperature/temperature.service.js';

const DEFAULT_PROFILES: Record<string, FanProfileConfig> = {
    silent: {
        description: 'Low noise, higher temperatures',
        curve: [
            { temp: 30, speed: 20 },
            { temp: 50, speed: 35 },
            { temp: 65, speed: 55 },
            { temp: 75, speed: 75 },
            { temp: 85, speed: 100 },
        ],
    },
    balanced: {
        description: 'Balance between noise and cooling',
        curve: [
            { temp: 30, speed: 30 },
            { temp: 45, speed: 45 },
            { temp: 60, speed: 65 },
            { temp: 70, speed: 80 },
            { temp: 80, speed: 100 },
        ],
    },
    performance: {
        description: 'Maximum cooling, higher noise',
        curve: [
            { temp: 30, speed: 50 },
            { temp: 40, speed: 65 },
            { temp: 55, speed: 80 },
            { temp: 65, speed: 90 },
            { temp: 75, speed: 100 },
        ],
    },
};

@Injectable()
export class FanCurveService implements OnModuleDestroy {
    private readonly logger = new Logger(FanCurveService.name);
    private curveInterval: ReturnType<typeof setInterval> | null = null;
    private activeZones: FanZoneConfig[] = [];
    private profiles: Record<string, FanProfileConfig> = { ...DEFAULT_PROFILES };
    private isApplyingCurves = false;

    constructor(
        private readonly hwmonService: HwmonService,
        private readonly temperatureService: TemperatureService,
        private readonly safetyService: FanSafetyService,
        private readonly configService: FanControlConfigService
    ) {}

    onModuleDestroy(): void {
        this.stop();
    }

    getProfiles(): Record<string, FanProfileConfig> {
        return { ...this.profiles };
    }

    getDefaultProfiles(): Record<string, FanProfileConfig> {
        return { ...DEFAULT_PROFILES };
    }

    interpolateSpeed(curve: FanCurvePointConfig[], temperature: number): number {
        if (curve.length === 0) {
            return 100;
        }

        const sorted = [...curve].sort((a, b) => a.temp - b.temp);

        if (temperature <= sorted[0].temp) {
            return sorted[0].speed;
        }
        if (temperature >= sorted[sorted.length - 1].temp) {
            return sorted[sorted.length - 1].speed;
        }

        for (let i = 0; i < sorted.length - 1; i++) {
            const lower = sorted[i];
            const upper = sorted[i + 1];
            if (temperature >= lower.temp && temperature <= upper.temp) {
                if (upper.temp === lower.temp) {
                    return upper.speed;
                }
                const ratio = (temperature - lower.temp) / (upper.temp - lower.temp);
                return lower.speed + ratio * (upper.speed - lower.speed);
            }
        }

        return 100;
    }

    async start(zones: FanZoneConfig[]): Promise<void> {
        this.stop();
        this.activeZones = zones;

        const config = this.configService.getConfig();
        const interval = config.polling_interval ?? 2000;

        if (config.profiles) {
            this.profiles = { ...DEFAULT_PROFILES, ...config.profiles };
        }

        this.curveInterval = setInterval(async () => {
            if (this.isApplyingCurves) {
                return;
            }
            try {
                await this.applyCurves();
            } catch (err) {
                this.logger.error(`Error applying fan curves: ${err}`);
            }
        }, interval);

        await this.applyCurves();
        this.logger.log(`Fan curve engine started with ${zones.length} zone(s)`);
    }

    stop(): void {
        if (this.curveInterval) {
            clearInterval(this.curveInterval);
            this.curveInterval = null;
            this.activeZones = [];
            this.logger.log('Fan curve engine stopped');
        }
    }

    isRunning(): boolean {
        return this.curveInterval !== null;
    }

    private async applyCurves(): Promise<void> {
        if (this.safetyService.isInEmergencyMode()) {
            return;
        }

        this.isApplyingCurves = true;
        try {
            const tempMetrics = await this.temperatureService.getMetrics();
            if (!tempMetrics) {
                return;
            }

            const readings = await this.hwmonService.readAll();

            const isOvertemp = await this.safetyService.checkTemperatureSafety(tempMetrics.sensors);
            if (isOvertemp) {
                return;
            }

            const isFanFailure = await this.safetyService.checkFanFailure(readings);
            if (isFanFailure || this.safetyService.isInEmergencyMode()) {
                return;
            }

            for (const zone of this.activeZones) {
                const profile = this.profiles[zone.profile];
                if (!profile) {
                    this.logger.warn(`Profile ${zone.profile} not found, skipping zone`);
                    continue;
                }

                const sensor = tempMetrics.sensors.find(
                    (s) => s.id === zone.sensor || s.name === zone.sensor
                );
                if (!sensor) {
                    this.logger.debug(`Sensor ${zone.sensor} not found, skipping zone`);
                    continue;
                }

                const targetSpeed = this.interpolateSpeed(profile.curve, sensor.current.value);
                const targetPwm = Math.round((targetSpeed / 100) * 255);

                for (const fanId of zone.fans) {
                    try {
                        const fan = readings.find((r) => r.id === fanId);
                        if (!fan || !fan.hasPwmControl) {
                            this.logger.debug(`Fan ${fanId} not found or not controllable, skipping`);
                            continue;
                        }

                        await this.safetyService.captureState(fanId, fan.devicePath, fan.pwmNumber, fan);

                        const isCpuFan = fan.fanNumber === 1 || fan.name.toLowerCase().includes('cpu');
                        const safePwm = isCpuFan
                            ? this.safetyService.validateCpuFanPwm(targetPwm)
                            : this.safetyService.validatePwmValue(targetPwm);

                        if (fan.pwmEnable !== 1) {
                            await this.hwmonService.setMode(fan.devicePath, fan.pwmNumber, 1);
                        }

                        await this.hwmonService.setPwm(fan.devicePath, fan.pwmNumber, safePwm);
                    } catch (err) {
                        this.logger.error(`Failed to apply curve to fan ${fanId}: ${err}`);
                    }
                }
            }
        } finally {
            this.isApplyingCurves = false;
        }
    }
}
