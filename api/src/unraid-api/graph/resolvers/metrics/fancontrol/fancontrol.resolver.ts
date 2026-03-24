import { Logger } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { pwmEnableToControlMode } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/controllers/controller.interface.js';
import { HwmonService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/controllers/hwmon.service.js';
import { FanSafetyService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fan-safety.service.js';
import { UpdateFanControlConfigInput } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fancontrol-config.model.js';
import { FanControlConfigService } from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fancontrol-config.service.js';
import {
    SetFanModeInput,
    SetFanSpeedInput,
} from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fancontrol.input.js';
import {
    FanControlMetrics,
    FanControlMode,
} from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fancontrol.model.js';

@Resolver(() => FanControlMetrics)
export class FanControlResolver {
    private readonly logger = new Logger(FanControlResolver.name);

    constructor(
        private readonly hwmonService: HwmonService,
        private readonly safetyService: FanSafetyService,
        private readonly configService: FanControlConfigService
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

        await this.safetyService.captureState(fan.id, fan.devicePath, fan.pwmNumber);

        const isCpuFan = fan.fanNumber === 1 || fan.name.toLowerCase().includes('cpu');
        if (isCpuFan) {
            this.logger.debug(
                `Fan ${input.fanId} identified as CPU fan via heuristic (fanNumber=${fan.fanNumber}, name=${fan.name})`
            );
        }
        const safePwm = isCpuFan
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

        const currentMode = pwmEnableToControlMode(fan.pwmEnable);
        if (!this.safetyService.validateModeTransition(input.mode)) {
            throw new Error(`Cannot transition from ${currentMode} to ${input.mode}`);
        }

        await this.safetyService.captureState(fan.id, fan.devicePath, fan.pwmNumber);

        const enableValue = this.modeToEnable(input.mode);
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
        return true;
    }

    private modeToEnable(mode: FanControlMode): number {
        switch (mode) {
            case FanControlMode.MANUAL:
                return 1;
            case FanControlMode.AUTOMATIC:
                return 2;
            case FanControlMode.FIXED:
                return 1;
            case FanControlMode.OFF:
                return 0;
            default:
                return 2;
        }
    }
}
