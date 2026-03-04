import { Injectable } from '@nestjs/common';

import type {
    CreateInternalBootPoolInput,
    OnboardingInternalBootResult,
} from '@app/unraid-api/graph/resolvers/onboarding/onboarding.model.js';
import { emcmd } from '@app/core/utils/clients/emcmd.js';
import { withTimeout } from '@app/core/utils/misc/with-timeout.js';

const INTERNAL_BOOT_COMMAND_TIMEOUT_MS = 180000;

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

    async createInternalBootPool(
        input: CreateInternalBootPoolInput
    ): Promise<OnboardingInternalBootResult> {
        const output: string[] = [];
        if (input.updateBios) {
            output.push(
                'Note: updateBios was requested; this API path only runs emcmd pool setup commands.'
            );
        }
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
