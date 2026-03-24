import { Injectable, Logger } from '@nestjs/common';

import { execa } from 'execa';

import {
    FanControllerProvider,
    RawFanReading,
} from '@app/unraid-api/graph/resolvers/metrics/fancontrol/controllers/controller.interface.js';

@Injectable()
export class IpmiFanService implements FanControllerProvider {
    readonly id = 'IpmiFanService';
    private readonly logger = new Logger(IpmiFanService.name);
    private readonly timeoutMs = 5000;

    async isAvailable(): Promise<boolean> {
        try {
            await execa('ipmitool', ['-V'], { timeout: this.timeoutMs });
            return true;
        } catch {
            return false;
        }
    }

    async readAll(): Promise<RawFanReading[]> {
        try {
            const { stdout } = await execa('ipmitool', ['sdr', 'type', 'Fan'], {
                timeout: this.timeoutMs,
            });

            return this.parseSdrOutput(stdout);
        } catch (err) {
            this.logger.error(`Failed to read IPMI fan sensors: ${err}`);
            return [];
        }
    }

    async setPwm(devicePath: string, pwmNumber: number, value: number): Promise<void> {
        if (!Number.isFinite(value) || value < 0 || value > 255) {
            throw new Error(`Invalid PWM value: ${value}. Must be a number between 0 and 255.`);
        }
        const percent = Math.round((Math.max(0, Math.min(255, value)) / 255) * 100);
        try {
            // NOTE: raw command 0x30 0x70 0x66 is Supermicro-specific fan control
            await execa(
                'ipmitool',
                ['raw', '0x30', '0x70', '0x66', '0x01', String(pwmNumber), String(percent)],
                {
                    timeout: this.timeoutMs,
                }
            );
            this.logger.debug(`IPMI: Set fan zone ${pwmNumber} to ${percent}%`);
        } catch (err) {
            this.logger.error(`IPMI setPwm failed: ${err}`);
            throw err;
        }
    }

    async setMode(devicePath: string, pwmNumber: number, mode: number): Promise<void> {
        const controlMode = mode === 1 ? '0x00' : '0x01';
        try {
            await execa('ipmitool', ['raw', '0x30', '0x45', controlMode], {
                timeout: this.timeoutMs,
            });
            this.logger.debug(`IPMI: Set fan mode to ${mode === 1 ? 'manual' : 'automatic'}`);
        } catch (err) {
            this.logger.error(`IPMI setMode failed: ${err}`);
            throw err;
        }
    }

    async restoreAutomatic(
        devicePath: string,
        pwmNumber: number,
        originalEnable: number
    ): Promise<void> {
        await this.setMode(devicePath, pwmNumber, 2);
    }

    private parseSdrOutput(stdout: string): RawFanReading[] {
        const readings: RawFanReading[] = [];
        const lines = stdout.split('\n').filter((l) => l.trim().length > 0);
        let fanIndex = 1;

        for (const line of lines) {
            const parts = line.split('|').map((s) => s.trim());
            if (parts.length < 5) {
                continue;
            }

            const [name, , , , reading] = parts;
            if (!name || !reading) {
                continue;
            }

            const rpmMatch = reading.match(/(\d+)\s*RPM/i);
            if (!rpmMatch) {
                continue;
            }

            const rpm = parseInt(rpmMatch[1], 10);
            readings.push({
                id: `ipmi:fan${fanIndex}`,
                name: name.trim(),
                rpm,
                pwmValue: 0,
                pwmEnable: -1,
                pwmMode: -1,
                hasPwmControl: false,
                devicePath: 'ipmi',
                fanNumber: fanIndex,
                pwmNumber: fanIndex,
            });
            fanIndex++;
        }

        return readings;
    }
}
