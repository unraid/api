import { Query, ResolveField, Resolver, Subscription } from '@nestjs/graphql';

import { Resource } from '@unraid/shared/graphql.model.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@unraid/shared/use-permissions.directive.js';
import { baseboard as getBaseboard, system as getSystem } from 'systeminformation';

import { createSubscription, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { getMachineId } from '@app/core/utils/misc/get-machine-id.js';
import {
    generateApps,
    generateCpu,
    generateDevices,
    generateDisplay,
    generateMemory,
    generateOs,
    generateVersions,
} from '@app/graphql/resolvers/query/info.js';
import {
    Baseboard,
    Devices,
    Display,
    Info,
    InfoApps,
    InfoCpu,
    InfoMemory,
    Os,
    System,
    Versions,
} from '@app/unraid-api/graph/resolvers/info/info.model.js';

@Resolver(() => Info)
export class InfoResolver {
    @Query(() => Info)
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.INFO,
        possession: AuthPossession.ANY,
    })
    public async info(): Promise<Info> {
        return {
            id: 'info',
            time: new Date(),
            apps: await this.apps(),
            baseboard: await this.baseboard(),
            cpu: await this.cpu(),
            devices: await this.devices(),
            display: await this.display(),
            machineId: await this.machineId(),
            memory: await this.memory(),
            os: await this.os(),
            system: await this.system(),
            versions: await this.versions(),
        };
    }

    @ResolveField(() => Date)
    public async time(): Promise<Date> {
        return new Date();
    }

    @ResolveField(() => InfoApps)
    public async apps(): Promise<InfoApps> {
        return generateApps();
    }

    @ResolveField(() => Baseboard)
    public async baseboard(): Promise<Baseboard> {
        const baseboard = await getBaseboard();
        return {
            id: 'baseboard',
            ...baseboard,
        };
    }

    @ResolveField(() => InfoCpu)
    public async cpu(): Promise<InfoCpu> {
        return generateCpu();
    }

    @ResolveField(() => Devices)
    public async devices(): Promise<Devices> {
        return generateDevices();
    }

    @ResolveField(() => Display)
    public async display(): Promise<Display> {
        return generateDisplay();
    }

    @ResolveField(() => String, { nullable: true })
    public async machineId(): Promise<string | undefined> {
        return getMachineId();
    }

    @ResolveField(() => InfoMemory)
    public async memory(): Promise<InfoMemory> {
        return generateMemory();
    }

    @ResolveField(() => Os)
    public async os(): Promise<Os> {
        return generateOs();
    }

    @ResolveField(() => System)
    public async system(): Promise<System> {
        const system = await getSystem();
        return {
            id: 'system',
            ...system,
        };
    }

    @ResolveField(() => Versions)
    public async versions(): Promise<Versions> {
        return generateVersions();
    }

    @Subscription(() => Info)
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.INFO,
        possession: AuthPossession.ANY,
    })
    public async infoSubscription() {
        return createSubscription(PUBSUB_CHANNEL.INFO);
    }
}
