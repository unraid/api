import { Injectable, OnModuleInit } from '@nestjs/common';
import { constants } from 'fs';
import { access } from 'fs/promises';

import type { Domain, DomainInfo, Hypervisor as HypervisorClass } from '@unraid/libvirt';
import { ConnectListAllDomainsFlags, DomainState, Hypervisor } from '@unraid/libvirt';
import { GraphQLError } from 'graphql';

import { libvirtLogger } from '@app/core/log.js';
import { VmDomain, VmState } from '@app/graphql/generated/api/types.js';
import { getters } from '@app/store/index.js';

@Injectable()
export class VmsService implements OnModuleInit {
    private hypervisor: InstanceType<typeof HypervisorClass> | null = null;
    private isVmsAvailable: boolean = false;
    private uri: string;

    constructor() {
        this.uri = process.env.LIBVIRT_URI ?? 'qemu:///system';
    }

    private async isLibvirtRunning(): Promise<boolean> {
        // Skip PID check for session URIs
        if (this.uri.includes('session')) {
            return true;
        }

        try {
            await access(getters.paths()['libvirt-pid'], constants.F_OK | constants.R_OK);
            return true;
        } catch (error) {
            return false;
        }
    }

    async onModuleInit() {
        try {
            libvirtLogger.info(`Initializing VMs service with URI: ${this.uri}`);
            await this.initializeHypervisor();
            this.isVmsAvailable = true;
            libvirtLogger.info(`VMs service initialized successfully with URI: ${this.uri}`);
        } catch (error) {
            this.isVmsAvailable = false;
            libvirtLogger.warn(
                'VMs are not available:',
                error instanceof Error ? error.message : 'Unknown error'
            );
        }
    }

    private async initializeHypervisor(): Promise<void> {
        libvirtLogger.info('Checking if libvirt is running...');
        const running = await this.isLibvirtRunning();
        if (!running) {
            throw new Error('Libvirt is not running');
        }
        libvirtLogger.info('Libvirt is running, creating hypervisor instance...');

        this.hypervisor = new Hypervisor({ uri: this.uri });
        try {
            libvirtLogger.info('Attempting to connect to hypervisor...');
            await this.hypervisor.connectOpen();
            libvirtLogger.info('Successfully connected to hypervisor');
        } catch (error) {
            libvirtLogger.error(
                `Failed starting VM hypervisor connection with "${(error as Error).message}"`
            );
            throw error;
        }

        if (!this.hypervisor) {
            throw new Error('Failed to connect to hypervisor');
        }
    }

    public async setVmState(uuid: string, targetState: VmState): Promise<boolean> {
        if (!this.isVmsAvailable || !this.hypervisor) {
            throw new GraphQLError('VMs are not available');
        }

        try {
            libvirtLogger.info(`Looking up domain with UUID: ${uuid}`);
            const domain = await this.hypervisor.domainLookupByUUIDString(uuid);
            libvirtLogger.info(`Found domain, getting info...`);
            const info = await domain.getInfo();
            libvirtLogger.info(`Current domain state: ${info.state}`);

            // Map VmState to DomainState for comparison
            const currentState = this.mapDomainStateToVmState(info.state);

            // Validate state transition
            if (!this.isValidStateTransition(currentState, targetState)) {
                throw new Error(`Invalid state transition from ${currentState} to ${targetState}`);
            }

            // Perform state transition
            switch (targetState) {
                case VmState.RUNNING:
                    if (currentState === VmState.SHUTOFF) {
                        libvirtLogger.info(`Starting domain...`);
                        await domain.create();
                    } else if (currentState === VmState.PAUSED) {
                        libvirtLogger.info(`Resuming domain...`);
                        await domain.resume();
                    }
                    break;
                case VmState.SHUTOFF:
                    if (currentState === VmState.RUNNING || currentState === VmState.PAUSED) {
                        libvirtLogger.info(`Initiating graceful shutdown for domain...`);
                        await this.hypervisor.domainShutdown(domain);

                        const shutdownSuccess = await this.waitForDomainShutdown(domain);
                        if (!shutdownSuccess) {
                            libvirtLogger.info('Graceful shutdown failed, forcing domain stop...');
                            await domain.destroy();
                        }
                    }
                    break;
                case VmState.PAUSED:
                    if (currentState === VmState.RUNNING) {
                        libvirtLogger.info(`Pausing domain...`);
                        await this.hypervisor.domainDestroy(domain);
                    }
                    break;
                default:
                    throw new Error(`Unsupported target state: ${targetState}`);
            }

            return true;
        } catch (error) {
            throw new GraphQLError(
                `Failed to set VM state: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    private mapDomainStateToVmState(domainState: DomainState): VmState {
        switch (domainState) {
            case DomainState.RUNNING:
                return VmState.RUNNING;
            case DomainState.BLOCKED:
                return VmState.IDLE;
            case DomainState.PAUSED:
                return VmState.PAUSED;
            case DomainState.SHUTDOWN:
                return VmState.SHUTDOWN;
            case DomainState.SHUTOFF:
                return VmState.SHUTOFF;
            case DomainState.CRASHED:
                return VmState.CRASHED;
            case DomainState.PMSUSPENDED:
                return VmState.PMSUSPENDED;
            default:
                return VmState.NOSTATE;
        }
    }

    private isValidStateTransition(currentState: VmState, targetState: VmState): boolean {
        // Define valid state transitions
        const validTransitions: Record<VmState, VmState[]> = {
            [VmState.NOSTATE]: [VmState.RUNNING, VmState.SHUTOFF],
            [VmState.RUNNING]: [VmState.PAUSED, VmState.SHUTOFF],
            [VmState.IDLE]: [VmState.RUNNING, VmState.SHUTOFF],
            [VmState.PAUSED]: [VmState.RUNNING, VmState.SHUTOFF],
            [VmState.SHUTDOWN]: [VmState.SHUTOFF],
            [VmState.SHUTOFF]: [VmState.RUNNING],
            [VmState.CRASHED]: [VmState.SHUTOFF],
            [VmState.PMSUSPENDED]: [VmState.RUNNING, VmState.SHUTOFF],
        };

        return validTransitions[currentState]?.includes(targetState) ?? false;
    }

    public async startVm(uuid: string): Promise<boolean> {
        return this.setVmState(uuid, VmState.RUNNING);
    }

    public async stopVm(uuid: string): Promise<boolean> {
        return this.setVmState(uuid, VmState.SHUTOFF);
    }

    public async pauseVm(uuid: string): Promise<boolean> {
        return this.setVmState(uuid, VmState.PAUSED);
    }

    public async resumeVm(uuid: string): Promise<boolean> {
        return this.setVmState(uuid, VmState.RUNNING);
    }

    public async forceStopVm(uuid: string): Promise<boolean> {
        if (!this.isVmsAvailable || !this.hypervisor) {
            throw new GraphQLError('VMs are not available');
        }

        try {
            libvirtLogger.info(`Looking up domain with UUID: ${uuid}`);
            const domain = await this.hypervisor.domainLookupByUUIDString(uuid);
            libvirtLogger.info(`Found domain, force stopping...`);

            await this.hypervisor.domainDestroy(domain);
            return true;
        } catch (error) {
            throw new GraphQLError(
                `Failed to force stop VM: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    public async rebootVm(uuid: string): Promise<boolean> {
        if (!this.isVmsAvailable || !this.hypervisor) {
            throw new GraphQLError('VMs are not available');
        }

        try {
            libvirtLogger.info(`Looking up domain with UUID: ${uuid}`);
            const domain = await this.hypervisor.domainLookupByUUIDString(uuid);
            libvirtLogger.info(`Found domain, rebooting...`);

            // First try graceful shutdown
            await this.hypervisor.domainShutdown(domain);

            // Wait for shutdown to complete
            const shutdownSuccess = await this.waitForDomainShutdown(domain);
            if (!shutdownSuccess) {
                libvirtLogger.info('Graceful shutdown failed, forcing domain stop...');
                await this.hypervisor.domainDestroy(domain);
            }

            // Start the domain again
            await domain.create();
            return true;
        } catch (error) {
            throw new GraphQLError(
                `Failed to reboot VM: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    public async resetVm(uuid: string): Promise<boolean> {
        if (!this.isVmsAvailable || !this.hypervisor) {
            throw new GraphQLError('VMs are not available');
        }

        try {
            libvirtLogger.info(`Looking up domain with UUID: ${uuid}`);
            const domain = await this.hypervisor.domainLookupByUUIDString(uuid);
            libvirtLogger.info(`Found domain, resetting...`);

            // Force stop the domain
            await this.hypervisor.domainDestroy(domain);

            // Start the domain again
            await domain.create();
            return true;
        } catch (error) {
            throw new GraphQLError(
                `Failed to reset VM: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    public async getDomains(): Promise<Array<VmDomain>> {
        if (!this.isVmsAvailable) {
            throw new GraphQLError('VMs are not available');
        }
        if (!this.hypervisor) {
            throw new GraphQLError('Libvirt is not initialized');
        }

        try {
            const hypervisor = this.hypervisor;
            libvirtLogger.info('Getting all domains...');
            // Get both active and inactive domains
            const domains = await hypervisor.connectListAllDomains(
                ConnectListAllDomainsFlags.ACTIVE | ConnectListAllDomainsFlags.INACTIVE
            );
            libvirtLogger.info(`Found ${domains.length} domains`);

            const resolvedDomains: Array<VmDomain> = await Promise.all(
                domains.map(async (domain) => {
                    const info = await domain.getInfo();
                    const name = await domain.getName();
                    const uuid = await domain.getUUIDString();
                    libvirtLogger.info(
                        `Found domain: ${name} (${uuid}) with state ${DomainState[info.state]}`
                    );

                    // Map DomainState to VmState using our existing function
                    const state = this.mapDomainStateToVmState(info.state);

                    return {
                        name,
                        uuid,
                        state,
                    };
                })
            );

            return resolvedDomains;
        } catch (error: unknown) {
            // If we hit an error expect libvirt to be offline
            this.isVmsAvailable = false;
            libvirtLogger.error(
                `Failed to get domains: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
            throw new GraphQLError(
                `Failed to get domains: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    private async waitForDomainShutdown(domain: Domain, maxRetries: number = 10): Promise<boolean> {
        if (!this.hypervisor) {
            throw new Error('Hypervisor is not initialized');
        }

        for (let i = 0; i < maxRetries; i++) {
            const currentInfo = await this.hypervisor.domainGetInfo(domain);
            if (currentInfo.state === DomainState.SHUTOFF) {
                libvirtLogger.info('Domain shutdown completed successfully');
                return true;
            }
            libvirtLogger.debug(`Waiting for domain shutdown... (attempt ${i + 1}/${maxRetries})`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        libvirtLogger.warn(`Domain shutdown timed out after ${maxRetries} attempts`);
        return false;
    }
}
