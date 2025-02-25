import { Query, ResolveField, Resolver, Subscription } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';
import { baseboard, system } from 'systeminformation';

import { createSubscription, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { getMachineId } from '@app/core/utils/misc/get-machine-id.js';
import { Resource } from '@app/graphql/generated/api/types.js';
import {
    generateApps,
    generateCpu,
    generateDevices,
    generateDisplay,
    generateMemory,
    generateOs,
    generateVersions,
} from '@app/graphql/resolvers/query/info.js';

@Resolver('Info')
export class InfoResolver {
    @Query()
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.INFO,
        possession: AuthPossession.ANY,
    })
    public async info() {
        return {
            id: 'info',
        };
    }

    @ResolveField('time')
    public async now() {
        return new Date().toISOString();
    }

    @ResolveField('apps')
    public async apps() {
        return generateApps();
    }

    @ResolveField('baseboard')
    public async baseboard() {
        return baseboard();
    }

    @ResolveField('cpu')
    public async cpu() {
        return generateCpu();
    }

    @ResolveField('devices')
    public async devices() {
        return generateDevices();
    }

    @ResolveField('display')
    public async display() {
        return generateDisplay();
    }

    @ResolveField('machineId')
    public async machineId() {
        return getMachineId();
    }

    @ResolveField('memory')
    public async memory() {
        return generateMemory();
    }

    @ResolveField('os')
    public async os() {
        return generateOs();
    }

    @ResolveField('system')
    public async system() {
        return system();
    }
    @ResolveField('versions')
    public async versions() {
        return generateVersions();
    }

    @Subscription('info')
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.INFO,
        possession: AuthPossession.ANY,
    })
    public async infoSubscription() {
        return createSubscription(PUBSUB_CHANNEL.INFO);
    }
}
