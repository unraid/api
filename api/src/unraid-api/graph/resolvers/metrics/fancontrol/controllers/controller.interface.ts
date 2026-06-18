import {
    FanConnectorType,
    FanControlMode,
} from '@app/unraid-api/graph/resolvers/metrics/fancontrol/fancontrol.model.js';

export interface RawFanReading {
    id: string;
    name: string;
    rpm: number;
    pwmValue: number;
    pwmEnable: number;
    pwmMode: number;
    hasPwmControl: boolean;
    devicePath: string;
    fanNumber: number;
    pwmNumber: number;
}

export interface FanControllerProvider {
    readonly id: string;

    isAvailable(): Promise<boolean>;

    readAll(): Promise<RawFanReading[]>;

    setPwm(devicePath: string, pwmNumber: number, value: number): Promise<void>;

    setMode(devicePath: string, pwmNumber: number, mode: number): Promise<void>;

    restoreAutomatic(devicePath: string, pwmNumber: number, originalEnable: number): Promise<void>;
}

export function pwmEnableToControlMode(enable: number): FanControlMode {
    // pwm*_enable: 1 = manual PWM. Everything else (0 = no control/full speed,
    // 2-5 = hardware automatic) is reported as automatic.
    return enable === 1 ? FanControlMode.MANUAL : FanControlMode.AUTOMATIC;
}

export function isCpuFan(name: string, fanNumber: number): boolean {
    return fanNumber === 1 || name.toLowerCase().includes('cpu');
}

export function pwmModeToConnectorType(mode: number): FanConnectorType {
    switch (mode) {
        case 0:
            return FanConnectorType.DC_3PIN;
        case 1:
            return FanConnectorType.PWM_4PIN;
        default:
            return FanConnectorType.UNKNOWN;
    }
}
