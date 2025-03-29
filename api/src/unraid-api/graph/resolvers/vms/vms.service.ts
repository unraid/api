import { Injectable, OnModuleInit } from '@nestjs/common';
import { execSync } from 'child_process';
import { constants } from 'fs';
import { access } from 'fs/promises';

import type { Hypervisor as HypervisorClass } from '@unraid/libvirt';
import { ConnectListAllDomainsFlags, DomainState, Hypervisor } from '@unraid/libvirt';
import { GraphQLError } from 'graphql';

import { libvirtLogger } from '@app/core/log.js';
import { VmDomain, VmState } from '@app/graphql/generated/api/types.js';

const libvirtPid = '/var/run/libvirt/libvirtd.pid';

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
            await access(libvirtPid, constants.F_OK | constants.R_OK);
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

    public async startVm(uuid: string): Promise<boolean> {
        if (!this.isVmsAvailable || !this.hypervisor) {
            throw new GraphQLError('VMs are not available');
        }

        try {
            libvirtLogger.info(`Looking up domain with UUID: ${uuid}`);
            const domain = await this.hypervisor.domainLookupByUUIDString(uuid);
            libvirtLogger.info(`Found domain, getting info...`);
            const info = await this.hypervisor.domainGetInfo(domain);
            libvirtLogger.info(`Domain state: ${info.state}`);
            if (info.state === DomainState.SHUTOFF) {
                libvirtLogger.info(`Starting domain...`);
                await this.hypervisor.domainCreate(domain);
                return true;
            }
            throw new Error('VM is already running');
        } catch (error) {
            libvirtLogger.error(
                `Failed to start VM: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
            throw new Error(
                `Failed to start VM: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    public async stopVm(uuid: string): Promise<boolean> {
        if (!this.isVmsAvailable || !this.hypervisor) {
            throw new GraphQLError('VMs are not available');
        }

        try {
            libvirtLogger.info(`Looking up domain with UUID: ${uuid}`);
            const domain = await this.hypervisor.domainLookupByUUIDString(uuid);
            libvirtLogger.info(`Found domain, getting info...`);
            const info = await this.hypervisor.domainGetInfo(domain);
            libvirtLogger.info(`Domain state: ${info.state}`);
            if (info.state === DomainState.RUNNING) {
                libvirtLogger.info(`Force stopping domain...`);
                await this.hypervisor.domainDestroy(domain);

                // Wait for the domain to reach SHUTOFF state
                let retries = 0;
                const maxRetries = 10;
                while (retries < maxRetries) {
                    const currentInfo = await this.hypervisor.domainGetInfo(domain);
                    libvirtLogger.info(`Current domain state: ${currentInfo.state}`);
                    if (currentInfo.state === DomainState.SHUTOFF) {
                        return true;
                    }
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    retries++;
                }

                throw new Error('VM failed to stop after force shutdown');
            }
            throw new Error('VM is not running');
        } catch (error) {
            libvirtLogger.error(
                `Failed to stop VM: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
            throw new Error(
                `Failed to stop VM: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    public async getDomains(): Promise<Array<VmDomain>> {
        if (!this.isVmsAvailable || !this.hypervisor) {
            libvirtLogger.warn('VMs are not available or hypervisor is not initialized');
            return [];
        }

        try {
            const hypervisor = this.hypervisor;
            libvirtLogger.info('Getting all domains...');
            // Get both active and inactive domains
            const activeDomains = await hypervisor.connectListAllDomains(ConnectListAllDomainsFlags.ACTIVE);
            const inactiveDomains = await hypervisor.connectListAllDomains(ConnectListAllDomainsFlags.INACTIVE);
            const domains = [...activeDomains, ...inactiveDomains];
            libvirtLogger.info(`Found ${domains.length} domains`);

            const resolvedDomains: Array<VmDomain> = await Promise.all(
                domains.map(async (domain) => {
                    const info = await hypervisor.domainGetInfo(domain);
                    const name = await hypervisor.domainGetName(domain);
                    const uuid = await hypervisor.domainGetUUIDString(domain);
                    libvirtLogger.info(
                        `Found domain: ${name} (${uuid}) with state ${DomainState[info.state]}`
                    );

                    // Map DomainState to VmState
                    let state = VmState.NOSTATE;
                    switch (info.state) {
                        case DomainState.RUNNING:
                            state = VmState.RUNNING;
                            break;
                        case DomainState.BLOCKED:
                            state = VmState.IDLE;
                            break;
                        case DomainState.PAUSED:
                            state = VmState.PAUSED;
                            break;
                        case DomainState.SHUTDOWN:
                            state = VmState.SHUTDOWN;
                            break;
                        case DomainState.SHUTOFF:
                            state = VmState.SHUTOFF;
                            break;
                        case DomainState.CRASHED:
                            state = VmState.CRASHED;
                            break;
                        case DomainState.PMSUSPENDED:
                            state = VmState.PMSUSPENDED;
                            break;
                        default:
                            state = VmState.NOSTATE;
                    }

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
}
