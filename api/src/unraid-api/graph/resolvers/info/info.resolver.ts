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
import { InfoService } from '@app/unraid-api/graph/resolvers/info/info.service.js';

@Resolver(() => Info)
export class InfoResolver {
    constructor(private readonly infoService: InfoService) {}

    @Query(() => Info)
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.INFO,
        possession: AuthPossession.ANY,
    })
    public async info(): Promise<Partial<Info>> {
        return {
            id: 'info',
        };
    }

    @ResolveField(() => Date)
    public async time(): Promise<Date> {
        return new Date();
    }

    @ResolveField(() => InfoApps)
    public async apps(): Promise<InfoApps> {
        return this.infoService.generateApps();
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
        return this.infoService.generateCpu();
    }

    @ResolveField(() => Devices)
    public async devices(): Promise<Devices> {
        return this.infoService.generateDevices();
    }

    @ResolveField(() => Display)
    public async display(): Promise<Display> {
        return this.infoService.generateDisplay();
    }

    @ResolveField(() => String, { nullable: true })
    public async machineId(): Promise<string | undefined> {
        return getMachineId();
    }

    @ResolveField(() => InfoMemory)
    public async memory(): Promise<InfoMemory> {
        return this.infoService.generateMemory();
    }

    @ResolveField(() => Os)
    public async os(): Promise<Os> {
        return this.infoService.generateOs();
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
        return this.infoService.generateVersions();
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
