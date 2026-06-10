import { Logger } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import {
    isCpuFan,
    pwmEnableToControlMode,
} from '@app/unraid-api/graph/resolvers/metrics/fancontrol/controllers/controller.interface.js';
import { HwmonService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/controllers/hwmon.service.js';
import { FanCurveService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fan-curve.service.js';
import { FanSafetyService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fan-safety.service.js';
import {
    FanControlConfig,
    UpdateFanControlConfigInput,
} from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fancontrol-config.model.js';
import { FanControlConfigService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fancontrol-config.service.js';
import {
    SetFanModeInput,
    SetFanProfileInput,
    SetFanSpeedInput,
} from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fancontrol.input.js';
import {
    CreateFanProfileInput,
    FanControlMetrics,
    FanControlMode,
} from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fancontrol.model.js';

@Resolver(() => FanControlMetrics)
export class FanControlResolver {
    private readonly logger = new Logger(FanControlResolver.name);

    constructor(
        private readonly hwmonService: HwmonService,
        private readonly safetyService: FanSafetyService,
        private readonly configService: FanControlConfigService,
        private readonly fanCurveService: FanCurveService
    ) {}

    @Mutation(() => Boolean, { description: 'Set fan PWM speed' })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.CONFIG,
    })
    async setFanSpeed(
        @Args('input', { type: () => SetFanSpeedInput }) input: SetFanSpeedInput
    ): Promise<boolean> {
        const config = this.configService.getConfig();
        if (!config.control_enabled) {
            throw new Error('Fan control is not enabled. Enable it in config first.');
        }

        if (this.safetyService.isInEmergencyMode()) {
            throw new Error('System is in emergency mode. Fan control is locked.');
        }

        const readings = await this.hwmonService.readAll();
        const fan = readings.find((r) => r.id === input.fanId);
        if (!fan) {
            throw new Error(`Fan ${input.fanId} not found`);
        }
        if (!fan.hasPwmControl) {
            throw new Error(`Fan ${input.fanId} does not support PWM control`);
        }

        this.assertNotUnderCurveControl(fan.id);

        await this.safetyService.captureState(fan.id, fan.devicePath, fan.pwmNumber);

        const cpuFan = isCpuFan(fan.name, fan.fanNumber);
        if (cpuFan) {
            this.logger.debug(
                `Fan ${input.fanId} identified as CPU fan via heuristic (fanNumber=${fan.fanNumber}, name=${fan.name})`
            );
        }
        const safePwm = cpuFan
            ? this.safetyService.validateCpuFanPwm(input.pwmValue)
            : this.safetyService.validatePwmValue(input.pwmValue);

        const currentMode = pwmEnableToControlMode(fan.pwmEnable);
        if (currentMode !== FanControlMode.MANUAL) {
            await this.hwmonService.setMode(fan.devicePath, fan.pwmNumber, 1);
        }

        await this.hwmonService.setPwm(fan.devicePath, fan.pwmNumber, safePwm);
        this.logger.log(`Set fan ${input.fanId} PWM to ${safePwm} (requested: ${input.pwmValue})`);

        return true;
    }

    @Mutation(() => Boolean, { description: 'Set fan control mode' })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.CONFIG,
    })
    async setFanMode(
        @Args('input', { type: () => SetFanModeInput }) input: SetFanModeInput
    ): Promise<boolean> {
        const config = this.configService.getConfig();
        if (!config.control_enabled) {
            throw new Error('Fan control is not enabled. Enable it in config first.');
        }

        if (this.safetyService.isInEmergencyMode()) {
            throw new Error('System is in emergency mode. Fan control is locked.');
        }

        const readings = await this.hwmonService.readAll();
        const fan = readings.find((r) => r.id === input.fanId);
        if (!fan) {
            throw new Error(`Fan ${input.fanId} not found`);
        }
        if (!fan.hasPwmControl) {
            throw new Error(`Fan ${input.fanId} does not support PWM control`);
        }

        this.assertNotUnderCurveControl(fan.id);

        const currentMode = pwmEnableToControlMode(fan.pwmEnable);
        if (!this.safetyService.validateModeTransition(input.mode)) {
            throw new Error(`Cannot transition from ${currentMode} to ${input.mode}`);
        }

        await this.safetyService.captureState(fan.id, fan.devicePath, fan.pwmNumber);

        const enableValue =
            input.mode === FanControlMode.MANUAL
                ? 1
                : this.resolveAutomaticEnable(fan.id, fan.pwmEnable);
        await this.hwmonService.setMode(fan.devicePath, fan.pwmNumber, enableValue);
        this.logger.log(`Set fan ${input.fanId} mode to ${input.mode} (enable=${enableValue})`);

        return true;
    }

    @Mutation(() => Boolean, { description: 'Restore all fans to their original/automatic state' })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.CONFIG,
    })
    async restoreAllFans(): Promise<boolean> {
        await this.safetyService.restoreAllFans();
        return true;
    }

    @Mutation(() => Boolean, { description: 'Update fan control configuration' })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.CONFIG,
    })
    async updateFanControlConfig(
        @Args('input', { type: () => UpdateFanControlConfigInput }) input: UpdateFanControlConfigInput
    ): Promise<boolean> {
        const current = this.configService.getConfig();

        const updated = {
            ...current,
            ...Object.fromEntries(Object.entries(input).filter(([_, v]) => v !== undefined)),
        };

        if (input.safety) {
            updated.safety = {
                ...current.safety,
                ...Object.fromEntries(Object.entries(input.safety).filter(([_, v]) => v !== undefined)),
            };
        }

        this.configService.replaceConfig(updated);

        if (updated.control_enabled && updated.zones && updated.zones.length > 0) {
            await this.fanCurveService.start(updated.zones);
            this.logger.log('Fan curve engine started with zone config');
        } else if (!updated.control_enabled || !updated.zones?.length) {
            await this.fanCurveService.stop();
            this.logger.log('Fan curve engine stopped');
        }

        return true;
    }

    @Mutation(() => Boolean, { description: 'Assign a fan profile to a specific fan' })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.CONFIG,
    })
    async setFanProfile(
        @Args('input', { type: () => SetFanProfileInput }) input: SetFanProfileInput
    ): Promise<boolean> {
        const config = this.configService.getConfig();
        if (!config.control_enabled) {
            throw new Error('Fan control is not enabled. Enable it in config first.');
        }

        const allProfiles = { ...this.fanCurveService.getProfiles(), ...(config.profiles ?? {}) };
        if (!allProfiles[input.profileName]) {
            throw new Error(
                `Profile "${input.profileName}" not found. Available: ${Object.keys(allProfiles).join(', ')}`
            );
        }

        const readings = await this.hwmonService.readAll();
        const fan = readings.find((r) => r.id === input.fanId);
        if (!fan) {
            throw new Error(`Fan ${input.fanId} not found`);
        }
        if (!fan.hasPwmControl) {
            throw new Error(`Fan ${input.fanId} does not support PWM control`);
        }

        const zones = config.zones ?? [];
        const existingZoneIdx = zones.findIndex((z) => z.fans.includes(input.fanId));
        if (existingZoneIdx >= 0) {
            const existingZone = zones[existingZoneIdx];
            if (existingZone.fans.length === 1) {
                existingZone.profile = input.profileName;
                if (input.temperatureSensorId) {
                    existingZone.sensor = input.temperatureSensorId;
                }
            } else {
                existingZone.fans = existingZone.fans.filter((id) => id !== input.fanId);
                zones.push({
                    fans: [input.fanId],
                    sensor: input.temperatureSensorId ?? existingZone.sensor,
                    profile: input.profileName,
                });
            }
        } else {
            if (!input.temperatureSensorId) {
                throw new Error(
                    'temperatureSensorId is required when assigning a profile to a fan not already in a zone'
                );
            }
            zones.push({
                fans: [input.fanId],
                sensor: input.temperatureSensorId,
                profile: input.profileName,
            });
        }

        const updated: FanControlConfig = { ...config, zones };
        this.configService.replaceConfig(updated);

        if (updated.control_enabled && zones.length > 0) {
            await this.fanCurveService.start(zones);
        }

        this.logger.log(`Assigned profile "${input.profileName}" to fan ${input.fanId}`);
        return true;
    }

    @Mutation(() => Boolean, { description: 'Create a custom fan profile' })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.CONFIG,
    })
    async createFanProfile(
        @Args('input', { type: () => CreateFanProfileInput }) input: CreateFanProfileInput
    ): Promise<boolean> {
        const config = this.configService.getConfig();
        const profiles = config.profiles ?? {};

        const builtInProfiles = this.fanCurveService.getDefaultProfiles();
        if (builtInProfiles[input.name]) {
            throw new Error(
                `Cannot overwrite built-in profile "${input.name}". Choose a different name.`
            );
        }

        if (profiles[input.name]) {
            throw new Error(
                `A custom profile named "${input.name}" already exists. Delete it first or choose a different name.`
            );
        }

        profiles[input.name] = {
            description: input.description,
            curve: input.curvePoints.map((p) => ({ temp: p.temperature, speed: p.speed })),
        };

        const updated: FanControlConfig = { ...config, profiles };
        this.configService.replaceConfig(updated);

        this.logger.log(`Created custom fan profile "${input.name}"`);
        return true;
    }

    private resolveAutomaticEnable(fanId: string, currentEnable: number): number {
        // Prefer the hardware mode captured before this API took manual control
        // (e.g. 5 = smart fan IV) over the generic thermal-cruise fallback.
        const originalEnable = this.safetyService.getOriginalEnable(fanId);
        if (originalEnable !== undefined && originalEnable >= 2) {
            return originalEnable;
        }
        if (currentEnable >= 2) {
            return currentEnable;
        }
        return 2;
    }

    private assertNotUnderCurveControl(fanId: string): void {
        if (!this.fanCurveService.isRunning()) {
            return;
        }
        const zones = this.configService.getConfig().zones ?? [];
        if (zones.some((zone) => zone.fans.includes(fanId))) {
            throw new Error(
                `Fan ${fanId} is under automatic curve control. Remove it from its zone before applying a manual override.`
            );
        }
    }
}
