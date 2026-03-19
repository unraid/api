import { Injectable, Logger } from '@nestjs/common';

import { execa } from 'execa';

import type {
    CreateInternalBootPoolInput,
    OnboardingInternalBootContext,
    OnboardingInternalBootResult,
} from '@app/unraid-api/graph/resolvers/onboarding/onboarding.model.js';
import { emcmd } from '@app/core/utils/clients/emcmd.js';
import { withTimeout } from '@app/core/utils/misc/with-timeout.js';
import { getShares } from '@app/core/utils/shares/get-shares.js';
import { getters } from '@app/store/index.js';
import { loadStateFileSync } from '@app/store/services/state-file-loader.js';
import { StateFileKey } from '@app/store/types.js';
import { ArrayDiskType, ArrayState } from '@app/unraid-api/graph/resolvers/array/array.model.js';
import { DisksService } from '@app/unraid-api/graph/resolvers/disks/disks.service.js';
import { InternalBootStateService } from '@app/unraid-api/graph/resolvers/disks/internal-boot-state.service.js';

const INTERNAL_BOOT_COMMAND_TIMEOUT_MS = 180000;
const EFI_BOOT_PATH = '\\EFI\\BOOT\\BOOTX64.EFI';

type ResolvedBootDevice = {
    bootId: string;
    devicePath: string;
};

@Injectable()
export class OnboardingInternalBootService {
    private readonly logger = new Logger(OnboardingInternalBootService.name);

    constructor(
        private readonly internalBootStateService: InternalBootStateService,
        private readonly disksService: DisksService
    ) {}

    private async isBootedFromFlashWithInternalBootSetup(): Promise<boolean> {
        return this.internalBootStateService.getBootedFromFlashWithInternalBootSetup();
    }

    private async runStep(
        commandText: string,
        command: Record<string, string>,
        output: string[]
    ): Promise<void> {
        output.push(`Running: emcmd ${commandText}`);
        this.logger.debug(
            `createInternalBootPool emcmd start command='${commandText}' payload=${this.stringifyForOutput(command)}`
        );
        try {
            await withTimeout(
                emcmd(command, { waitForToken: true }),
                INTERNAL_BOOT_COMMAND_TIMEOUT_MS,
                `internal boot (${commandText})`
            );
            this.logger.debug(`createInternalBootPool emcmd success command='${commandText}'`);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(
                `createInternalBootPool emcmd failed command='${commandText}' error='${message}'`
            );
            throw error;
        }
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

    private stringifyForOutput(value: unknown): string {
        try {
            return JSON.stringify(value);
        } catch {
            return '[unserializable]';
        }
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
        this.logger.debug(
            `createInternalBootPool efibootmgr start args=${this.stringifyForOutput(args)}`
        );
        try {
            const result = await execa('efibootmgr', args, { reject: false });
            const lines = this.commandOutputLines(result.stdout, result.stderr);
            if (lines.length > 0) {
                output.push(...lines);
            }
            this.logger.debug(
                `createInternalBootPool efibootmgr result exitCode=${result.exitCode ?? 1} outputLines=${lines.length}`
            );
            if ((result.exitCode ?? 1) !== 0) {
                this.logger.warn(
                    `createInternalBootPool efibootmgr non-zero exitCode=${result.exitCode ?? 1} args=${this.stringifyForOutput(args)}`
                );
            }
            return {
                exitCode: result.exitCode ?? 1,
                lines,
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            output.push(message);
            this.logger.warn(`createInternalBootPool efibootmgr threw error='${message}'`);
            return {
                exitCode: 1,
                lines: [],
            };
        }
    }

    private loadEmhttpBootContext(forceRefresh = false): void {
        const emhttpState = getters.emhttp();
        const hasVar =
            typeof emhttpState.var === 'object' &&
            emhttpState.var !== null &&
            Object.keys(emhttpState.var).length > 0;
        const hasDevices = Array.isArray(emhttpState.devices) && emhttpState.devices.length > 0;
        const hasDisks = Array.isArray(emhttpState.disks) && emhttpState.disks.length > 0;
        if (forceRefresh || !hasVar) {
            loadStateFileSync(StateFileKey.var);
        }
        if (forceRefresh || !hasDevices) {
            loadStateFileSync(StateFileKey.devs);
        }
        if (forceRefresh || !hasDisks) {
            loadStateFileSync(StateFileKey.disks);
        }
    }

    private splitCsvValues(value: string | null | undefined): string[] {
        if (typeof value !== 'string') {
            return [];
        }

        return value
            .split(',')
            .map((entry) => entry.trim())
            .filter((entry) => entry.length > 0);
    }

    private async getInternalBootCandidateDisks() {
        return this.disksService.getAssignableDisks();
    }

    private getPoolNamesFromEmhttpState(): string[] {
        const emhttpState = getters.emhttp();
        const names = new Set<string>();

        for (const disk of emhttpState.disks ?? []) {
            const type = typeof disk.type === 'string' ? disk.type : '';
            const name = typeof disk.name === 'string' ? disk.name.trim() : '';
            if (type === ArrayDiskType.CACHE && name.length > 0) {
                names.add(name);
            }
        }

        return Array.from(names);
    }

    private getShareNames(): string[] {
        const shareNames = new Set<string>();
        for (const share of [...getShares('users'), ...getShares('disks')]) {
            const name = typeof share.name === 'string' ? share.name.trim() : '';
            if (name.length > 0) {
                shareNames.add(name);
            }
        }
        return Array.from(shareNames);
    }

    public async getInternalBootContext(): Promise<OnboardingInternalBootContext> {
        this.loadEmhttpBootContext();

        const vars = getters.emhttp().var ?? {};
        let bootedFromFlashWithInternalBootSetup = false;

        try {
            bootedFromFlashWithInternalBootSetup =
                await this.internalBootStateService.getBootedFromFlashWithInternalBootSetup();
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Failed to resolve internal boot context boot state: ${message}`);
        }

        return {
            arrayStopped: vars.mdState === ArrayState.STOPPED || vars.fsState === 'Stopped',
            bootEligible:
                typeof vars.bootEligible === 'boolean'
                    ? vars.bootEligible
                    : vars.bootEligible === null
                      ? null
                      : undefined,
            bootedFromFlashWithInternalBootSetup,
            enableBootTransfer:
                typeof vars.enableBootTransfer === 'string' ? vars.enableBootTransfer : null,
            reservedNames: this.splitCsvValues(vars.reservedNames),
            shareNames: this.getShareNames(),
            poolNames: this.getPoolNamesFromEmhttpState(),
            assignableDisks: await this.getInternalBootCandidateDisks(),
        };
    }

    public async refreshInternalBootContext(): Promise<OnboardingInternalBootContext> {
        this.loadEmhttpBootContext(true);
        await this.internalBootStateService.invalidateCachedInternalBootDeviceState();
        return this.getInternalBootContext();
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

    private async deleteExistingBootEntries(
        bootLabelMap: Map<string, string>,
        output: string[]
    ): Promise<boolean> {
        let hadFailures = false;
        for (const bootNumber of bootLabelMap.values()) {
            const deleteResult = await this.runEfiBootMgr(['-b', bootNumber, '-B'], output);
            if (deleteResult.exitCode !== 0) {
                hadFailures = true;
                output.push(
                    `efibootmgr failed to delete boot entry ${bootNumber} (rc=${deleteResult.exitCode})`
                );
            }
        }
        return hadFailures;
    }

    private async resolveRequestedBootDevices(
        bootIds: string[],
        output: string[]
    ): Promise<Map<string, ResolvedBootDevice>> {
        this.loadEmhttpBootContext(true);
        const candidateDisks = await this.getInternalBootCandidateDisks();
        const snapshot = candidateDisks.map((disk) => ({
            id: disk.id,
            serialNum: disk.serialNum,
            device: disk.device,
        }));
        output.push(`candidateDisks snapshot: ${this.stringifyForOutput(snapshot)}`);
        this.logger.debug(
            `createInternalBootPool candidateDisks snapshot=${this.stringifyForOutput(snapshot)}`
        );

        const resolved = new Map<string, ResolvedBootDevice>();

        for (const disk of candidateDisks) {
            const bootId = disk.serialNum.trim();
            const devicePath = disk.device.trim();
            if (bootId.length === 0 || devicePath.length === 0) {
                continue;
            }

            resolved.set(bootId, { bootId, devicePath });
        }

        output.push(
            `candidateDisks resolved serialNum->device: ${this.stringifyForOutput(Array.from(resolved.entries()))}`
        );
        this.logger.debug(
            `createInternalBootPool candidateDisks resolved serialNum->device=${this.stringifyForOutput(Array.from(resolved.entries()))}`
        );

        for (const bootId of bootIds) {
            if (resolved.has(bootId)) {
                continue;
            }

            const warning = `Unable to resolve boot device for serial '${bootId}' from candidateDisks; skipping BIOS entry creation for this disk.`;
            output.push(warning);
            this.logger.warn(
                `createInternalBootPool could not resolve serial='${bootId}' from candidateDisks`
            );
        }

        return resolved;
    }

    private async createInternalBootEntries(
        devices: string[],
        resolvedDevices: Map<string, ResolvedBootDevice>,
        output: string[]
    ): Promise<boolean> {
        let hadFailures = false;
        for (const bootDevice of devices) {
            const resolved = resolvedDevices.get(bootDevice);
            if (!resolved) {
                continue;
            }
            output.push(
                `Boot device resolution: input='${bootDevice}' source=candidateDisks resolved='${resolved.devicePath}'`
            );
            this.logger.debug(
                `createInternalBootPool boot device resolved input='${bootDevice}' source=candidateDisks resolved='${resolved.devicePath}'`
            );

            const createResult = await this.runEfiBootMgr(
                [
                    '-c',
                    '-d',
                    resolved.devicePath,
                    '-p',
                    '2',
                    '-L',
                    `Unraid Internal Boot - ${resolved.bootId}`,
                    '-l',
                    EFI_BOOT_PATH,
                ],
                output
            );
            if (createResult.exitCode !== 0) {
                hadFailures = true;
                output.push(
                    `efibootmgr failed for ${this.shellQuote(resolved.devicePath)} (rc=${createResult.exitCode})`
                );
            }
        }
        return hadFailures;
    }

    private async createFlashBootEntry(output: string[]): Promise<boolean> {
        const flashDevice = this.getFlashDeviceFromEmhttpState();
        if (!flashDevice) {
            this.logger.warn('createInternalBootPool flash device was not found in emhttp.disks');
            return false;
        }

        const device = flashDevice.trim();
        const devicePath = `/dev/${device}`;
        this.logger.debug(`createInternalBootPool flash device resolved='${devicePath}'`);
        const flashResult = await this.runEfiBootMgr(
            ['-c', '-d', devicePath, '-p', '1', '-L', 'Unraid Flash', '-l', EFI_BOOT_PATH],
            output
        );
        if (flashResult.exitCode !== 0) {
            output.push(`efibootmgr failed for flash (rc=${flashResult.exitCode})`);
            return true;
        }
        return false;
    }

    private buildDesiredBootOrder(devices: string[], labelMap: Map<string, string>): string[] {
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

        return [...new Set(desiredOrder.filter((entry) => entry.length > 0))];
    }

    private async updateBootOrder(devices: string[], output: string[]): Promise<boolean> {
        this.logger.debug(
            `createInternalBootPool boot order update start requestedDevices=${this.stringifyForOutput(devices)}`
        );
        const currentEntries = await this.runEfiBootMgr([], output);
        if (currentEntries.exitCode !== 0) {
            return true;
        }

        const labelMap = this.parseBootLabelMap(currentEntries.lines);
        const uniqueOrder = this.buildDesiredBootOrder(devices, labelMap);
        this.logger.debug(
            `createInternalBootPool boot order candidates=${this.stringifyForOutput(uniqueOrder)} labels=${this.stringifyForOutput(Array.from(labelMap.entries()))}`
        );
        if (uniqueOrder.length === 0) {
            return false;
        }

        const nextBoot = uniqueOrder[0];
        const orderArgs = ['-o', uniqueOrder.join(',')];
        if (nextBoot) {
            orderArgs.push('-n', nextBoot);
        }

        const orderResult = await this.runEfiBootMgr(orderArgs, output);
        if (orderResult.exitCode !== 0) {
            output.push(`efibootmgr failed to set boot order (rc=${orderResult.exitCode})`);
            return true;
        }
        return false;
    }

    private async updateBiosBootEntries(
        devices: string[],
        resolvedDevices: Map<string, ResolvedBootDevice>,
        output: string[]
    ): Promise<{ hadFailures: boolean }> {
        let hadFailures = false;
        this.logger.debug(
            `createInternalBootPool BIOS update start devices=${this.stringifyForOutput(devices)}`
        );
        this.logger.debug(
            `createInternalBootPool BIOS update resolved device count=${resolvedDevices.size}`
        );

        const existingEntries = await this.runEfiBootMgr([], output);
        if (existingEntries.exitCode === 0) {
            const bootLabelMap = this.parseBootLabelMap(existingEntries.lines);
            hadFailures = (await this.deleteExistingBootEntries(bootLabelMap, output)) || hadFailures;
        }

        hadFailures =
            (await this.createInternalBootEntries(devices, resolvedDevices, output)) || hadFailures;
        hadFailures = (await this.createFlashBootEntry(output)) || hadFailures;
        hadFailures = (await this.updateBootOrder(devices, output)) || hadFailures;
        this.logger.debug(`createInternalBootPool BIOS update finished hadFailures=${hadFailures}`);

        return { hadFailures };
    }

    async createInternalBootPool(
        input: CreateInternalBootPoolInput
    ): Promise<OnboardingInternalBootResult> {
        const output: string[] = [];
        this.logger.debug(`createInternalBootPool received input=${this.stringifyForOutput(input)}`);
        if (input.reboot) {
            output.push(
                'Note: reboot was requested; onboarding handles reboot separately after internal boot setup.'
            );
        }

        const duplicateDevice = this.hasDuplicateDevices(input.devices);
        if (duplicateDevice) {
            this.logger.warn(`createInternalBootPool duplicate device detected id='${duplicateDevice}'`);
            return {
                ok: false,
                code: 2,
                output: `mkbootpool: duplicate device id: ${duplicateDevice}`,
            };
        }

        try {
            if (await this.isBootedFromFlashWithInternalBootSetup()) {
                this.logger.warn(
                    'createInternalBootPool aborted because internal boot is already configured'
                );
                return {
                    ok: false,
                    code: 3,
                    output: 'mkbootpool: internal boot is already configured while the system is still booted from flash',
                };
            }

            const resolvedBootDevices = input.updateBios
                ? await this.resolveRequestedBootDevices(input.devices, output)
                : new Map<string, ResolvedBootDevice>();

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
                this.logger.debug('createInternalBootPool invoking BIOS boot entry updates');
                output.push('Applying BIOS boot entry updates...');
                const biosUpdateResult = await this.updateBiosBootEntries(
                    input.devices,
                    resolvedBootDevices,
                    output
                );
                this.logger.debug(
                    `createInternalBootPool BIOS boot entry updates completed hadFailures=${biosUpdateResult.hadFailures}`
                );
                output.push(
                    biosUpdateResult.hadFailures
                        ? 'BIOS boot entry updates completed with warnings; manual BIOS boot order changes may still be required.'
                        : 'BIOS boot entry updates completed successfully.'
                );
            }

            try {
                await this.internalBootStateService.invalidateCachedInternalBootDeviceState();
                this.logger.debug('createInternalBootPool invalidated internal boot state cache');
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                this.logger.warn(
                    `Failed to invalidate cached internal boot device state after successful setup: ${message}`
                );
            }

            this.logger.debug('createInternalBootPool completed successfully');
            return {
                ok: true,
                code: 0,
                output: output.join('\n') || 'No output',
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(`createInternalBootPool failed with error='${message}'`);
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
