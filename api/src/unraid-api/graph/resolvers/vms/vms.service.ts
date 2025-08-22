import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { Timeout } from '@nestjs/schedule';
import { constants } from 'fs';
import { access } from 'fs/promises';

import type { Domain, Hypervisor as HypervisorClass } from '@unraid/libvirt';
import { ConnectListAllDomainsFlags, DomainState, Hypervisor } from '@unraid/libvirt';
import { FSWatcher, watch } from 'chokidar';
import { GraphQLError } from 'graphql';

import { getters } from '@app/store/index.js';
import { VmDomain, VmState } from '@app/unraid-api/graph/resolvers/vms/vms.model.js';

@Injectable()
export class VmsService implements OnApplicationBootstrap, OnModuleDestroy {
    private readonly logger = new Logger(VmsService.name);
    private hypervisor: InstanceType<typeof HypervisorClass> | null = null;
    private isVmsAvailable: boolean = false;
    private watcher: FSWatcher | null = null;
    private uri: string;
    private pidPath: string;

    constructor() {
        this.uri = process.env.LIBVIRT_URI ?? 'qemu:///system';
        this.pidPath = getters.paths()?.['libvirt-pid'] ?? '/var/run/libvirt/libvirtd.pid';
        this.logger.debug(`Using libvirt PID path: ${this.pidPath}`);
    }

    private async isLibvirtRunning(): Promise<boolean> {
        if (this.uri.includes('session')) {
            return true;
        }

        try {
            await access(this.pidPath, constants.F_OK | constants.R_OK);
            return true;
        } catch (error) {
            return false;
        }
    }

    async onApplicationBootstrap() {
        this.logger.debug(`Initializing VMs service with URI: ${this.uri}`);
        await this.attemptHypervisorInitializationAndWatch();
    }

    @Timeout(10_000)
    async healInitialization(maxRetries = 12, delay = 10_000) {
        let retries = 1;
        while (!this.isVmsAvailable && retries <= maxRetries) {
            this.logger.log(`Attempting to initialize VMs service...attempt ${retries}/${maxRetries}`);
            await this.attemptHypervisorInitializationAndWatch();
            await new Promise((resolve) => setTimeout(resolve, delay));
            retries++;
        }
    }

    async onModuleDestroy() {
        this.logger.debug('Closing file watcher...');
        await this.watcher?.close();
        this.logger.debug('Closing hypervisor connection...');
        try {
            await this.hypervisor?.connectClose();
        } catch (error) {
            this.logger.warn(`Error closing hypervisor connection: ${(error as Error).message}`);
        }
        this.hypervisor = null;
        this.isVmsAvailable = false;
        this.logger.debug('VMs service cleanup complete.');
    }

    private async attemptHypervisorInitializationAndWatch(): Promise<void> {
        try {
            await this.initializeHypervisor();
            this.isVmsAvailable = true;
            this.logger.debug(`VMs service initialized successfully with URI: ${this.uri}`);
            await this.setupWatcher();
        } catch (error) {
            this.isVmsAvailable = false;
            this.logger.warn(
                `Initial hypervisor connection failed: ${error instanceof Error ? error.message : 'Unknown error'}. Setting up watcher.`
            );
            await this.setupWatcher();
        }
    }

    private async setupWatcher(): Promise<void> {
        if (this.watcher) {
            this.logger.debug('Closing existing file watcher before setting up a new one.');
            await this.watcher.close();
        }

        this.logger.debug(`Setting up watcher for PID file: ${this.pidPath}`);
        this.watcher = watch(this.pidPath, {
            ignoreInitial: true,
            atomic: true,
            awaitWriteFinish: true,
        });

        this.watcher
            .on('add', async () => {
                this.logger.log(
                    `Libvirt PID file detected at ${this.pidPath}. Attempting connection...`
                );
                try {
                    await this.initializeHypervisor();
                    this.isVmsAvailable = true;
                    this.logger.log(
                        'Hypervisor connection established successfully after PID file detection.'
                    );
                } catch (error) {
                    this.isVmsAvailable = false;
                    this.logger.error(
                        `Failed to initialize hypervisor after PID file detection: ${error instanceof Error ? error.message : 'Unknown error'}`
                    );
                }
            })
            .on('unlink', async () => {
                this.logger.warn(
                    `Libvirt PID file removed from ${this.pidPath}. Hypervisor likely stopped.`
                );
                this.isVmsAvailable = false;
                try {
                    if (this.hypervisor) {
                        await this.hypervisor.connectClose();
                        this.logger.debug('Hypervisor connection closed due to PID file removal.');
                    }
                } catch (closeError) {
                    this.logger.error(
                        `Error closing hypervisor connection after PID unlink: ${closeError instanceof Error ? closeError.message : 'Unknown error'}`
                    );
                }
                this.hypervisor = null;
            })
            .on('error', (error: unknown) => {
                this.logger.error(
                    `Watcher error for ${this.pidPath}: ${error instanceof Error ? error.message : error}`
                );
            });
    }

    private async initializeHypervisor(): Promise<void> {
        if (this.hypervisor && this.isVmsAvailable) {
            this.logger.debug('Hypervisor connection assumed active based on availability flag.');
            return;
        }

        this.logger.debug('Checking if libvirt process is running via PID file...');
        const running = await this.isLibvirtRunning();
        if (!running) {
            throw new Error('Libvirt is not running');
        }
        this.logger.debug('Libvirt appears to be running, creating hypervisor instance...');

        if (!this.hypervisor) {
            this.hypervisor = new Hypervisor({ uri: this.uri });
        }

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

            const currentState = this.mapDomainStateToVmState(info.state);

            if (!this.isValidStateTransition(currentState, targetState)) {
                throw new Error(`Invalid state transition from ${currentState} to ${targetState}`);
            }

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

            await domain.shutdown();

            const shutdownSuccess = await this.waitForDomainShutdown(domain);
            if (!shutdownSuccess) {
                throw new Error('Graceful shutdown failed, please force stop the VM and try again');
            }

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

            await domain.destroy();

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
            const domains = await hypervisor.connectListAllDomains(
                ConnectListAllDomainsFlags.ACTIVE | ConnectListAllDomainsFlags.INACTIVE
            );
            this.logger.debug(`Found ${domains.length} domains`);

            const resolvedDomains: Array<VmDomain> = await Promise.all(
                domains.map(async (domain) => {
                    const info = await domain.getInfo();
                    const name = await domain.getName();
                    const uuid = await domain.getUUIDString();
                    const state = this.mapDomainStateToVmState(info.state);

                    return {
                        id: uuid,
                        uuid,
                        name,
                        state,
                    };
                })
            );

            return resolvedDomains;
        } catch (error: unknown) {
            if (error instanceof Error && error.message.includes('virConnectListAllDomains')) {
                this.logger.error(
                    `Failed to list domains, possibly due to connection issue: ${error.message}`
                );
            } else {
                this.logger.error(
                    `Failed to get domains: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
            }
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
