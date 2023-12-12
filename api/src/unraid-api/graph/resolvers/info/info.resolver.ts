import { PUBSUB_CHANNEL, createSubscription } from '@app/core/pubsub';
import { getMachineId } from '@app/core/utils/misc/get-machine-id';
import {
    generateApps,
    generateCpu,
    generateDevices,
    generateDisplay,
    generateMemory,
    generateOs,
    generateVersions,
} from '@app/graphql/resolvers/query/info';
import { Query, ResolveField, Resolver, Subscription } from '@nestjs/graphql';
import { UseRoles } from 'nest-access-control';
import { baseboard, system } from 'systeminformation';

@Resolver('Info')
export class InfoResolver {
    @Query()
    @UseRoles({
        resource: 'info',
        action: 'read',
        possession: 'any',
    })
    public async info() {
        return {};
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
    @UseRoles({
        resource: 'info',
        action: 'read',
        possession: 'any',
    })
    public async infoSubscription() {
        return createSubscription(PUBSUB_CHANNEL.INFO);
    }
}
