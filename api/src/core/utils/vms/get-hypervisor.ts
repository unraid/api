import { constants } from 'fs';
import { access } from 'fs/promises';

import type { Hypervisor as HypervisorType } from '@unraid/libvirt';

import { libvirtLogger } from '@app/core/log';

const uri = process.env.LIBVIRT_URI ?? 'qemu:///system';

const libvirtPid = '/var/run/libvirt/libvirtd.pid';

const isLibvirtRunning = async (): Promise<boolean> => {
    try {
        await access(libvirtPid, constants.F_OK | constants.R_OK);
        return true;
    } catch (error) {
        return false;
    }
};

export class UnraidHypervisor {
    private static instance: UnraidHypervisor | null = null;
    private hypervisor: HypervisorType | null = null;
    private constructor() {}

    public static getInstance(): UnraidHypervisor {
        if (this.instance === null) {
            this.instance = new UnraidHypervisor();
        }
        return this.instance;
    }

    public async getHypervisor(): Promise<HypervisorType | null> {
        // Return hypervisor if it's already connected
        const running = await isLibvirtRunning();

        if (this.hypervisor && running) {
            return this.hypervisor;
        }

        if (!running) {
            this.hypervisor = null;
            throw new Error('Libvirt is not running');
        }
        const { Hypervisor } = await import('@unraid/libvirt');
        this.hypervisor = new Hypervisor({ uri });
        await this.hypervisor.connectOpen().catch((error: unknown) => {
            libvirtLogger.error(
                `Failed starting VM hypervisor connection with "${(error as Error).message}"`
            );

            throw error;
        });

        return this.hypervisor;
    }
}
