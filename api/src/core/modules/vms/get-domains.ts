import { GraphQLError } from 'graphql';

import type { VmDomain } from '@app/graphql/generated/api/types.js';
import { VmState } from '@app/graphql/generated/api/types.js';

const states = {
    0: 'NOSTATE',
    1: 'RUNNING',
    2: 'IDLE',
    3: 'PAUSED',
    4: 'SHUTDOWN',
    5: 'SHUTOFF',
    6: 'CRASHED',
    7: 'PMSUSPENDED',
};

/**
 * Get vm domains.
 */
export const getDomains = async () => {
    try {
        const { ConnectListAllDomainsFlags } = await import('@unraid/libvirt');
        const { UnraidHypervisor } = await import('@app/core/utils/vms/get-hypervisor.js');

        const hypervisor = await UnraidHypervisor.getInstance().getHypervisor();
        if (!hypervisor) {
            throw new GraphQLError('VMs Disabled');
        }

        const autoStartDomains = await hypervisor.connectListAllDomains(
            ConnectListAllDomainsFlags.AUTOSTART
        );

        const autoStartDomainNames = await Promise.all(
            autoStartDomains.map(async (domain) => hypervisor.domainGetName(domain))
        );

        // Get all domains
        const domains = await hypervisor.connectListAllDomains();

        const resolvedDomains: Array<VmDomain> = await Promise.all(
            domains.map(async (domain) => {
                const info = await hypervisor.domainGetInfo(domain);
                const name = await hypervisor.domainGetName(domain);
                const features = {};
                return {
                    name,
                    uuid: await hypervisor.domainGetUUIDString(domain),
                    state: VmState[states[info.state]] ?? VmState.NOSTATE,
                    autoStart: autoStartDomainNames.includes(name),
                    features,
                };
            })
        );

        return resolvedDomains;
    } catch (error: unknown) {
        // If we hit an error expect libvirt to be offline
        throw new GraphQLError(
            `Failed to fetch domains with error: ${error instanceof Error ? error.message : 'Unknown Error'}`
        );
    }
};
