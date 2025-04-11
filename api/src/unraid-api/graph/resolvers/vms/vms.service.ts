import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { constants } from 'fs';
import { access } from 'fs/promises';

import type { Domain, Hypervisor as HypervisorClass } from '@unraid/libvirt';
import { ConnectListAllDomainsFlags, DomainState, Hypervisor } from '@unraid/libvirt';
import { GraphQLError } from 'graphql';

import { getters } from '@app/store/index.js';
import { VmDomain, VmState } from '@app/unraid-api/graph/resolvers/vms/vms.model.js';

@Injectable()
export class VmsService implements OnModuleInit {
    private readonly logger = new Logger(VmsService.name);
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
            this.logger.debug(`Initializing VMs service with URI: ${this.uri}`);
            await this.initializeHypervisor();
            this.isVmsAvailable = true;
            this.logger.debug(`VMs service initialized successfully with URI: ${this.uri}`);
        } catch (error) {
            this.isVmsAvailable = false;
            this.logger.warn(
                `VMs are not available: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    private async initializeHypervisor(): Promise<void> {
        this.logger.debug('Checking if libvirt is running...');
        const running = await this.isLibvirtRunning();
        if (!running) {
            throw new Error('Libvirt is not running');
        }
        this.logger.debug('Libvirt is running, creating hypervisor instance...');

        this.hypervisor = new Hypervisor({ uri: this.uri });
        try {
            this.logger.debug('Attempting to connect to hypervisor...');
            await this.hypervisor.connectOpen();
            this.logger.debug('Successfully connected to hypervisor');
        } catch (error) {
            this.logger.error(
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
            this.logger.debug(`Looking up domain with UUID: ${uuid}`);
            const domain = await this.hypervisor.domainLookupByUUIDString(uuid);
            this.logger.debug(`Found domain, getting info...`);
            const info = await domain.getInfo();
            this.logger.debug(`Current domain state: ${info.state}`);

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
                        this.logger.debug(`Starting domain...`);
                        await domain.create();
                    } else if (currentState === VmState.PAUSED) {
                        this.logger.debug(`Resuming domain...`);
                        await domain.resume();
                    }
                    break;
                case VmState.SHUTOFF:
                    if (currentState === VmState.RUNNING || currentState === VmState.PAUSED) {
                        this.logger.debug(`Initiating graceful shutdown for domain...`);
                        await domain.shutdown();

                        const shutdownSuccess = await this.waitForDomainShutdown(domain);
                        if (!shutdownSuccess) {
                            this.logger.debug('Graceful shutdown failed, forcing domain stop...');
                            await domain.destroy();
                        }
                    }
                    break;
                case VmState.PAUSED:
                    if (currentState === VmState.RUNNING) {
                        this.logger.debug(`Pausing domain...`);
                        await domain.suspend();
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
            this.logger.debug(`Looking up domain with UUID: ${uuid}`);
            const domain = await this.hypervisor.domainLookupByUUIDString(uuid);
            this.logger.debug(`Found domain, force stopping...`);

            await domain.destroy();
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
            this.logger.debug(`Looking up domain with UUID: ${uuid}`);
            const domain = await this.hypervisor.domainLookupByUUIDString(uuid);
            this.logger.debug(`Found domain, rebooting...`);

            // First try graceful shutdown
            await domain.shutdown();

            // Wait for shutdown to complete
            const shutdownSuccess = await this.waitForDomainShutdown(domain);
            if (!shutdownSuccess) {
                throw new Error('Graceful shutdown failed, please force stop the VM and try again');
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
            this.logger.debug(`Looking up domain with UUID: ${uuid}`);
            const domain = await this.hypervisor.domainLookupByUUIDString(uuid);
            this.logger.debug(`Found domain, resetting...`);

            // Force stop the domain
            await domain.destroy();

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
            this.logger.debug('Getting all domains...');
            // Get both active and inactive domains
            const domains = await hypervisor.connectListAllDomains(
                ConnectListAllDomainsFlags.ACTIVE | ConnectListAllDomainsFlags.INACTIVE
            );
            this.logger.debug(`Found ${domains.length} domains`);

            const resolvedDomains: Array<VmDomain> = await Promise.all(
                domains.map(async (domain) => {
                    const info = await domain.getInfo();
                    const name = await domain.getName();
                    const uuid = await domain.getUUIDString();
                    this.logger.debug(
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
            this.logger.error(
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
                this.logger.debug('Domain shutdown completed successfully');
                return true;
            }
            this.logger.debug(`Waiting for domain shutdown... (attempt ${i + 1}/${maxRetries})`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        this.logger.warn(`Domain shutdown timed out after ${maxRetries} attempts`);
        return false;
    }
}
