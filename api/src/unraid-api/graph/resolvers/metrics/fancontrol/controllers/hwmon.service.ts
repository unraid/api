import { Injectable, Logger } from '@nestjs/common';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
    FanControllerProvider,
    RawFanReading,
} from '@app/unraid-api/graph/resolvers/metrics/fancontrol/controllers/controller.interface.js';

const HWMON_PATH = '/sys/class/hwmon';

interface HwmonDevice {
    name: string;
    path: string;
    fans: number[];
    pwms: number[];
}

@Injectable()
export class HwmonService implements FanControllerProvider {
    readonly id = 'HwmonService';
    private readonly logger = new Logger(HwmonService.name);
    private devices: HwmonDevice[] = [];
    private initialized = false;
    private initPromise: Promise<void> | null = null;

    async isAvailable(): Promise<boolean> {
        try {
            const entries = await readdir(HWMON_PATH);
            return entries.length > 0;
        } catch {
            return false;
        }
    }

    async readAll(): Promise<RawFanReading[]> {
        if (!this.initialized) {
            if (!this.initPromise) {
                this.initPromise = this.detectDevices().then(
                    () => {
                        this.initialized = true;
                    },
                    (err) => {
                        this.initPromise = null;
                        throw err;
                    }
                );
            }
            await this.initPromise;
        }

        const readings: RawFanReading[] = [];

        for (const device of this.devices) {
            for (const fanNumber of device.fans) {
                const pwmNumber = fanNumber;
                const hasPwm = device.pwms.includes(pwmNumber);

                const rpm = await this.readSysfsInt(device.path, `fan${fanNumber}_input`);
                const pwmValue = hasPwm ? await this.readSysfsInt(device.path, `pwm${pwmNumber}`) : 0;
                const pwmEnable = hasPwm
                    ? await this.readSysfsInt(device.path, `pwm${pwmNumber}_enable`)
                    : -1;
                const pwmMode = hasPwm
                    ? await this.readSysfsInt(device.path, `pwm${pwmNumber}_mode`)
                    : -1;

                readings.push({
                    id: `${device.name}:fan${fanNumber}`,
                    name: `${device.name} Fan ${fanNumber}`,
                    rpm,
                    pwmValue,
                    pwmEnable,
                    pwmMode,
                    hasPwmControl: hasPwm,
                    devicePath: device.path,
                    fanNumber,
                    pwmNumber,
                });
            }
        }

        return readings;
    }

    async setPwm(devicePath: string, pwmNumber: number, value: number): Promise<void> {
        const clamped = Math.max(0, Math.min(255, Math.round(value)));
        await this.writeSysfs(devicePath, `pwm${pwmNumber}`, clamped.toString());
    }

    async setMode(devicePath: string, pwmNumber: number, mode: number): Promise<void> {
        await this.writeSysfs(devicePath, `pwm${pwmNumber}_enable`, mode.toString());
    }

    async restoreAutomatic(
        devicePath: string,
        pwmNumber: number,
        originalEnable: number
    ): Promise<void> {
        const restoreValue = originalEnable >= 2 ? originalEnable : 2;
        await this.writeSysfs(devicePath, `pwm${pwmNumber}_enable`, restoreValue.toString());
    }

    private async detectDevices(): Promise<void> {
        this.devices = [];

        try {
            const entries = await readdir(HWMON_PATH);

            for (const entry of entries) {
                const devicePath = join(HWMON_PATH, entry);

                try {
                    const name = (await readFile(join(devicePath, 'name'), 'utf-8')).trim();
                    const files = await readdir(devicePath);

                    const fans = files
                        .filter((f) => /^fan\d+_input$/.test(f))
                        .map((f) => {
                            const m = f.match(/^fan(\d+)_input$/);
                            return m ? parseInt(m[1], 10) : NaN;
                        })
                        .filter((n) => !Number.isNaN(n))
                        .sort((a, b) => a - b);

                    const pwms = files
                        .filter((f) => /^pwm\d+$/.test(f))
                        .map((f) => {
                            const m = f.match(/^pwm(\d+)$/);
                            return m ? parseInt(m[1], 10) : NaN;
                        })
                        .filter((n) => !Number.isNaN(n))
                        .sort((a, b) => a - b);

                    if (fans.length > 0) {
                        this.devices.push({ name, path: devicePath, fans, pwms });
                        this.logger.log(
                            `Detected hwmon device: ${name} at ${devicePath} (${fans.length} fans, ${pwms.length} PWM controls)`
                        );
                    }
                } catch {
                    // Device doesn't have the necessary files — skip
                }
            }

            this.initialized = true;
        } catch (err) {
            this.logger.warn(`Failed to scan hwmon devices: ${err}`);
        }
    }

    async rescan(): Promise<void> {
        this.initialized = false;
        this.initPromise = null;
        await this.detectDevices();
        this.initialized = true;
    }

    private async readSysfsInt(devicePath: string, filename: string): Promise<number> {
        try {
            const content = await readFile(join(devicePath, filename), 'utf-8');
            return parseInt(content.trim(), 10);
        } catch {
            return 0;
        }
    }

    private async writeSysfs(devicePath: string, filename: string, value: string): Promise<void> {
        const filePath = join(devicePath, filename);
        await writeFile(filePath, value, 'utf-8');
        this.logger.debug(`Wrote ${value} to ${filePath}`);
    }
}
