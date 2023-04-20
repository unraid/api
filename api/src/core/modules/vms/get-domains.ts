/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { ConnectListAllDomainsFlags } from '@vmngr/libvirt';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { getHypervisor } from '@app/core/utils/vms/get-hypervisor';
import { VmState, type VmDomain, type VmsResolvers } from '@app/graphql/generated/api/types';
import { GraphQLError } from 'graphql';

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
export const domainResolver: VmsResolvers['domain'] = async (
    _,
    __,
    context
) => {
    const { user } = context;

    // Check permissions
    ensurePermission(user, {
        resource: 'vms/domain',
        action: 'read',
        possession: 'any',
    });

    try {
        const hypervisor = await getHypervisor();
        if (!hypervisor) {
            throw new GraphQLError('VMs Disabled');
        }

        const autoStartDomains = await hypervisor.connectListAllDomains(
            ConnectListAllDomainsFlags.AUTOSTART
        );

        const autoStartDomainNames = await Promise.all(
            autoStartDomains.map(async (domain) =>
                hypervisor.domainGetName(domain)
            )
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

        return  resolvedDomains;
    } catch (error: unknown) {
        // If we hit an error expect libvirt to be offline
        throw new GraphQLError(`Failed to fetch domains with error: ${error instanceof Error ? error.message : 'Unknown Error'}`);
    }
};
