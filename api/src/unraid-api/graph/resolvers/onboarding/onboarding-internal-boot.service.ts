import { Injectable } from '@nestjs/common';

import { execa } from 'execa';

import type {
    CreateInternalBootPoolInput,
    OnboardingInternalBootResult,
} from '@app/unraid-api/graph/resolvers/onboarding/onboarding.model.js';
import { emcmd } from '@app/core/utils/clients/emcmd.js';
import { withTimeout } from '@app/core/utils/misc/with-timeout.js';
import { getters } from '@app/store/index.js';
import { loadStateFileSync } from '@app/store/services/state-file-loader.js';
import { StateFileKey } from '@app/store/types.js';
import { ArrayDiskType } from '@app/unraid-api/graph/resolvers/array/array.model.js';

const INTERNAL_BOOT_COMMAND_TIMEOUT_MS = 180000;
const EFI_BOOT_PATH = '\\EFI\\BOOT\\BOOTX64.EFI';

type EmhttpDeviceRecord = {
    id: string;
    device: string;
};

const isEmhttpDeviceRecord = (value: unknown): value is EmhttpDeviceRecord => {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const record = value as { id?: unknown; device?: unknown };
    return typeof record.id === 'string' && typeof record.device === 'string';
};

@Injectable()
export class OnboardingInternalBootService {
    private async runStep(
        commandText: string,
        command: Record<string, string>,
        output: string[]
    ): Promise<void> {
        output.push(`Running: emcmd ${commandText}`);
        await withTimeout(
            emcmd(command, { waitForToken: true }),
            INTERNAL_BOOT_COMMAND_TIMEOUT_MS,
            `internal boot (${commandText})`
        );
    }

    private hasDuplicateDevices(devices: string[]): string | null {
        const seen = new Set<string>();
        for (const device of devices) {
            if (seen.has(device)) {
                return device;
            }
            seen.add(device);
        }
        return null;
    }

    private shellQuote(value: string): string {
        return `'${value.replaceAll("'", `'"'"'`)}'`;
    }

    private commandOutputLines(stdout: string, stderr: string): string[] {
        const merged = [stdout, stderr].filter((value) => value.length > 0).join('\n');
        if (merged.length === 0) {
            return [];
        }
        return merged.split('\n');
    }

    private parseBootLabelMap(lines: string[]): Map<string, string> {
        const labels = new Map<string, string>();
        for (const line of lines) {
            const match = line.match(/^Boot([0-9A-Fa-f]{4})\*?\s+(.+)$/);
            if (!match) {
                continue;
            }
            const bootNumber = match[1]?.toUpperCase();
            const labelText = match[2]?.trim();
            if (bootNumber && labelText) {
                labels.set(labelText, bootNumber);
            }
        }
        return labels;
    }

    private async runEfiBootMgr(
        args: string[],
        output: string[]
    ): Promise<{
        exitCode: number;
        lines: string[];
    }> {
        const commandText = args.map((arg) => this.shellQuote(arg)).join(' ');
        output.push(`Running: efibootmgr${commandText.length > 0 ? ` ${commandText}` : ''}`);
        try {
            const result = await execa('efibootmgr', args, { reject: false });
            const lines = this.commandOutputLines(result.stdout, result.stderr);
            if (lines.length > 0) {
                output.push(...lines);
            }
            return {
                exitCode: result.exitCode ?? 1,
                lines,
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            output.push(message);
            return {
                exitCode: 1,
                lines: [],
            };
        }
    }

    private ensureEmhttpBootContext(): void {
        const emhttpState = getters.emhttp();
        const hasDevices = Array.isArray(emhttpState.devices) && emhttpState.devices.length > 0;
        const hasDisks = Array.isArray(emhttpState.disks) && emhttpState.disks.length > 0;
        if (!hasDevices) {
            loadStateFileSync(StateFileKey.devs);
        }
        if (!hasDisks) {
            loadStateFileSync(StateFileKey.disks);
        }
    }

    private getDeviceMapFromEmhttpState(): Map<string, string> {
        const emhttpState = getters.emhttp();
        const rawDevices = Array.isArray(emhttpState.devices) ? emhttpState.devices : [];
        const devicesById = new Map<string, string>();

        for (const rawDevice of rawDevices) {
            if (!isEmhttpDeviceRecord(rawDevice)) {
                continue;
            }
            const id = rawDevice.id.trim();
            const device = rawDevice.device.trim();
            if (id.length > 0 && device.length > 0) {
                devicesById.set(id, device);
            }
        }

        return devicesById;
    }

    private getFlashDeviceFromEmhttpState(): string | null {
        const emhttpState = getters.emhttp();
        const emhttpDisks = Array.isArray(emhttpState.disks) ? emhttpState.disks : [];
        for (const disk of emhttpDisks) {
            if (!disk || typeof disk !== 'object') {
                continue;
            }
            if (disk.type !== ArrayDiskType.FLASH) {
                continue;
            }
            const device = typeof disk.device === 'string' ? disk.device.trim() : '';
            if (device.length > 0) {
                return device;
            }
        }
        return null;
    }

    private async updateBiosBootEntries(
        devices: string[],
        output: string[]
    ): Promise<{ hadFailures: boolean }> {
        let hadFailures = false;
        this.ensureEmhttpBootContext();
        const devsById = this.getDeviceMapFromEmhttpState();

        const existingEntries = await this.runEfiBootMgr([], output);
        const bootLabelMap =
            existingEntries.exitCode === 0
                ? this.parseBootLabelMap(existingEntries.lines)
                : new Map<string, string>();

        for (const bootNumber of bootLabelMap.values()) {
            const deleteResult = await this.runEfiBootMgr(['-b', bootNumber, '-B'], output);
            if (deleteResult.exitCode !== 0) {
                hadFailures = true;
                output.push(
                    `efibootmgr failed to delete boot entry ${bootNumber} (rc=${deleteResult.exitCode})`
                );
            }
        }

        for (const bootDevice of devices) {
            const bootId = bootDevice;
            let device = bootDevice;
            if (device === '' || devsById.has(device)) {
                const mapped = devsById.get(device);
                if (mapped) {
                    device = mapped;
                }
            }
            if (device === '') {
                continue;
            }
            const devicePath = `/dev/${device}`;
            const createResult = await this.runEfiBootMgr(
                [
                    '-c',
                    '-d',
                    devicePath,
                    '-p',
                    '2',
                    '-L',
                    `Unraid Internal Boot - ${bootId}`,
                    '-l',
                    EFI_BOOT_PATH,
                ],
                output
            );
            if (createResult.exitCode !== 0) {
                hadFailures = true;
                output.push(
                    `efibootmgr failed for ${this.shellQuote(devicePath)} (rc=${createResult.exitCode})`
                );
            }
        }

        const flashDevice = this.getFlashDeviceFromEmhttpState();
        if (flashDevice) {
            const device = flashDevice.trim();
            const devicePath = `/dev/${device}`;
            const flashResult = await this.runEfiBootMgr(
                ['-c', '-d', devicePath, '-p', '1', '-L', 'Unraid Flash'],
                output
            );
            if (flashResult.exitCode !== 0) {
                hadFailures = true;
                output.push(`efibootmgr failed for flash (rc=${flashResult.exitCode})`);
            }
        }

        const currentEntries = await this.runEfiBootMgr([], output);
        if (currentEntries.exitCode !== 0) {
            hadFailures = true;
            return { hadFailures };
        }

        const labelMap = this.parseBootLabelMap(currentEntries.lines);
        const desiredOrder: string[] = [];

        for (const bootId of devices) {
            const expectedLabel = `Unraid Internal Boot - ${bootId}`.toLowerCase();
            for (const [labelText, bootNumber] of labelMap.entries()) {
                if (labelText.toLowerCase().includes(expectedLabel)) {
                    desiredOrder.push(bootNumber);
                    break;
                }
            }
        }

        for (const [labelText, bootNumber] of labelMap.entries()) {
            if (labelText.toLowerCase().includes('unraid flash')) {
                desiredOrder.push(bootNumber);
                break;
            }
        }

        const uniqueOrder = [...new Set(desiredOrder.filter((entry) => entry.length > 0))];
        if (uniqueOrder.length === 0) {
            return { hadFailures };
        }

        const nextBoot = uniqueOrder[0];
        const orderArgs = ['-o', uniqueOrder.join(',')];
        if (nextBoot) {
            orderArgs.push('-n', nextBoot);
        }

        const orderResult = await this.runEfiBootMgr(orderArgs, output);
        if (orderResult.exitCode !== 0) {
            hadFailures = true;
            output.push(`efibootmgr failed to set boot order (rc=${orderResult.exitCode})`);
        }

        return { hadFailures };
    }

    async createInternalBootPool(
        input: CreateInternalBootPoolInput
    ): Promise<OnboardingInternalBootResult> {
        const output: string[] = [];
        if (input.reboot) {
            output.push(
                'Note: reboot was requested; onboarding handles reboot separately after internal boot setup.'
            );
        }

        const duplicateDevice = this.hasDuplicateDevices(input.devices);
        if (duplicateDevice) {
            return {
                ok: false,
                code: 2,
                output: `mkbootpool: duplicate device id: ${duplicateDevice}`,
            };
        }

        try {
            await this.runStep(
                'debug=cmdCreatePool,cmdAssignDisk,cmdMakeBootable',
                { debug: 'cmdCreatePool,cmdAssignDisk,cmdMakeBootable' },
                output
            );

            await this.runStep(
                `cmdCreatePool=apply&poolName=${input.poolName}&poolSlots=${input.devices.length}`,
                {
                    cmdCreatePool: 'apply',
                    poolName: input.poolName,
                    poolSlots: String(input.devices.length),
                },
                output
            );

            for (const [index, diskId] of input.devices.entries()) {
                const slot = index + 1;
                const diskName = slot === 1 ? input.poolName : `${input.poolName}${slot}`;
                await this.runStep(
                    `cmdAssignDisk=apply&diskName=${diskName}&diskId=${diskId}`,
                    {
                        cmdAssignDisk: 'apply',
                        diskName,
                        diskId,
                    },
                    output
                );
            }

            await this.runStep(
                `cmdMakeBootable=apply&poolName=${input.poolName}&poolBootSize=${input.bootSizeMiB}`,
                {
                    cmdMakeBootable: 'apply',
                    poolName: input.poolName,
                    poolBootSize: String(input.bootSizeMiB),
                },
                output
            );

            if (input.updateBios) {
                output.push('Applying BIOS boot entry updates...');
                const biosUpdateResult = await this.updateBiosBootEntries(input.devices, output);
                output.push(
                    biosUpdateResult.hadFailures
                        ? 'BIOS boot entry updates completed with warnings; manual BIOS boot order changes may still be required.'
                        : 'BIOS boot entry updates completed successfully.'
                );
            }

            return {
                ok: true,
                code: 0,
                output: output.join('\n') || 'No output',
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            output.push('mkbootpool: command failed or timed out');
            output.push(message);
            return {
                ok: false,
                code: 1,
                output: output.join('\n') || 'mkbootpool: command failed or timed out',
            };
        }
    }
}
