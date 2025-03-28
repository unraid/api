import { Injectable } from '@nestjs/common';

import { DomainState } from '@unraid/libvirt';

import { UnraidHypervisor } from '@app/core/utils/vms/get-hypervisor.js';

@Injectable()
export class VmsService {
    public async startVm(id: number): Promise<boolean> {
        try {
            const hypervisor = await UnraidHypervisor.getInstance().getHypervisor();
            const domain = await hypervisor?.domainLookupByID(id);
            if (
                (await domain?.getState()) === DomainState.SHUTOFF ||
                (await domain?.getState()) === DomainState.SHUTOFF
            ) {
                await domain?.resume();
                return true;
            }
            throw new Error('VM is already running');
        } catch (error) {
            throw new Error(
                `Failed to start VM: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    public async stopVm(id: number): Promise<boolean> {
        try {
            const hypervisor = await UnraidHypervisor.getInstance().getHypervisor();
            const domain = await hypervisor?.domainLookupByID(id);
            if ((await domain?.getState()) === DomainState.RUNNING) {
                await domain?.shutdown();
                return true;
            }
            throw new Error('VM is not running');
        } catch (error) {
            throw new Error(
                `Failed to stop VM: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }
}
