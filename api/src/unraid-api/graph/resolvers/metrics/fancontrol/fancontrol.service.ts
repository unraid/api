import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import {
    FanControllerProvider,
    pwmEnableToControlMode,
    pwmModeToConnectorType,
} from '@app/unraid-api/graph/resolvers/metrics/fancontrol/controllers/controller.interface.js';
import { HwmonService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/controllers/hwmon.service.js';
import { IpmiFanService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/controllers/ipmi_fan.service.js';
import { FanControlConfigService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fancontrol-config.service.js';
import {
    Fan,
    FanControlMetrics,
    FanControlSummary,
    FanSpeed,
    FanType,
} from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fancontrol.model.js';

@Injectable()
export class FanControlService implements OnModuleInit {
    private readonly logger = new Logger(FanControlService.name);
    private providers: FanControllerProvider[] = [];
    private availableProviders: FanControllerProvider[] = [];
    private cache: FanControlMetrics | null = null;
    private cacheTimestamp = 0;
    private readonly CACHE_TTL_MS = 1000;

    constructor(
        private readonly hwmonService: HwmonService,
        private readonly ipmiFanService: IpmiFanService,
        private readonly configService: FanControlConfigService
    ) {}

    async onModuleInit(): Promise<void> {
        this.providers = [this.hwmonService, this.ipmiFanService];

        for (const provider of this.providers) {
            const available = await provider.isAvailable();
            if (available) {
                this.availableProviders.push(provider);
                this.logger.log(`Fan controller available: ${provider.id}`);
            } else {
                this.logger.debug(`Fan controller not available: ${provider.id}`);
            }
        }

        if (this.availableProviders.length === 0) {
            this.logger.warn('No fan controllers detected');
        }
    }

    async getMetrics(): Promise<FanControlMetrics> {
        const isCacheValid = this.cache && Date.now() - this.cacheTimestamp < this.CACHE_TTL_MS;
        if (isCacheValid && this.cache) {
            return this.cache;
        }

        const config = this.configService.getConfig();
        if (!config.enabled) {
            return this.emptyMetrics();
        }

        const fans: Fan[] = [];

        for (const provider of this.availableProviders) {
            try {
                const readings = await provider.readAll();

                for (const reading of readings) {
                    if (!Number.isFinite(reading.rpm)) {
                        continue;
                    }

                    const pwmPercent =
                        reading.hasPwmControl && reading.pwmValue >= 0
                            ? (reading.pwmValue / 255) * 100
                            : 0;

                    const speed: FanSpeed = {
                        rpm: reading.rpm,
                        pwm: Math.round(pwmPercent * 100) / 100,
                        timestamp: new Date(),
                    };

                    const fan = Object.assign(new Fan(), {
                        id: reading.id,
                        name: reading.name,
                        type: this.inferFanType(reading.name, reading.fanNumber),
                        connectorType: pwmModeToConnectorType(reading.pwmMode),
                        header: `Fan Header ${reading.fanNumber}`,
                        current: speed,
                        mode: pwmEnableToControlMode(reading.pwmEnable),
                        controllable: reading.hasPwmControl,
                        detected: reading.rpm > 0,
                    });

                    fans.push(fan);
                }
            } catch (err) {
                this.logger.error(`Error reading from ${provider.id}: ${err}`);
            }
        }

        const summary = this.buildSummary(fans);

        const metrics = Object.assign(new FanControlMetrics(), {
            id: 'fanControl',
            fans,
            profiles: [],
            summary,
        });

        this.cache = metrics;
        this.cacheTimestamp = Date.now();

        return metrics;
    }

    private buildSummary(fans: Fan[]): FanControlSummary {
        const detectedFans = fans.filter((f) => f.detected);
        const controllableFans = fans.filter((f) => f.controllable && f.detected);
        const rpms = detectedFans.map((f) => f.current.rpm).filter((r) => r > 0);
        const speeds = detectedFans.map((f) => f.current.pwm).filter((s) => s > 0);

        const fansNeedingAttention = fans
            .filter((f) => f.controllable && !f.detected)
            .map((f) => f.name);

        return {
            totalFans: fans.length,
            controllableFans: controllableFans.length,
            averageRpm: rpms.length > 0 ? Math.round(rpms.reduce((a, b) => a + b, 0) / rpms.length) : 0,
            averageSpeed:
                speeds.length > 0
                    ? Math.round((speeds.reduce((a, b) => a + b, 0) / speeds.length) * 100) / 100
                    : 0,
            fansNeedingAttention: fansNeedingAttention.length > 0 ? fansNeedingAttention : undefined,
        };
    }

    private inferFanType(name: string, fanNumber: number): FanType {
        const lower = name.toLowerCase();
        if (lower.includes('cpu') || fanNumber === 1) {
            return FanType.CPU;
        }
        if (lower.includes('gpu')) {
            return FanType.GPU;
        }
        if (lower.includes('chassis') || lower.includes('rear') || lower.includes('exhaust')) {
            return FanType.CASE_EXHAUST;
        }
        if (lower.includes('front') || lower.includes('intake')) {
            return FanType.CASE_INTAKE;
        }
        return FanType.CUSTOM;
    }

    private emptyMetrics(): FanControlMetrics {
        return Object.assign(new FanControlMetrics(), {
            id: 'fanControl',
            fans: [],
            profiles: [],
            summary: {
                totalFans: 0,
                controllableFans: 0,
                averageSpeed: 0,
                averageRpm: 0,
            },
        });
    }
}
