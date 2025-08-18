import { OnModuleInit } from '@nestjs/common';
import {
    Parent,
    Query,
    Resolver,
    Subscription,
    ResolveField,
} from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';

import { Resource } from '@unraid/shared/graphql.model.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@unraid/shared/use-permissions.directive.js';
import {
    baseboard as getBaseboard,
    system as getSystem,
} from 'systeminformation';

import { getMachineId } from '@app/core/utils/misc/get-machine-id.js';
import {
    createSubscription,
    PUBSUB_CHANNEL,
    pubsub,
} from '@app/core/pubsub.js';

import { DisplayService } from '@app/unraid-api/graph/resolvers/display/display.service.js';
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
    CpuUtilization,
} from '@app/unraid-api/graph/resolvers/info/info.model.js';
import { CpuDataService } from '@app/unraid-api/graph/resolvers/info/cpu-data.service.js';
import { InfoService } from '@app/unraid-api/graph/resolvers/info/info.service.js';
import { SubscriptionTrackerService } from '@app/unraid-api/graph/services/subscription-tracker.service.js';

const CPU_UTILIZATION = 'CPU_UTILIZATION';

@Resolver(() => Info)
export class InfoResolver implements OnModuleInit {
    private cpuPollingTimer: NodeJS.Timeout;

    constructor(
        private readonly infoService: InfoService,
        private readonly displayService: DisplayService,
        private readonly subscriptionTracker: SubscriptionTrackerService,
        private readonly cpuDataService: CpuDataService
    ) {}

    onModuleInit() {
        this.subscriptionTracker.registerTopic(
            CPU_UTILIZATION,
            () => {
                this.cpuPollingTimer = setInterval(async () => {
                    const payload = await this.infoService.generateCpuLoad();
                    pubsub.publish(CPU_UTILIZATION, { cpuUtilization: payload });
                }, 1000);
            },
            () => {
                clearInterval(this.cpuPollingTimer);
            }
        );
    }

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
        return this.displayService.generateDisplay();
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

    @Query(() => CpuUtilization)
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.INFO,
        possession: AuthPossession.ANY,
    })
    public async cpuUtilization(): Promise<CpuUtilization> {
        const { currentLoad: load, cpus } = await this.cpuDataService.getCpuLoad();
        return {
            id: 'info/cpu-load',
            load,
            cpus,
        };
    }

    @Subscription(() => CpuUtilization, {
        name: 'cpuUtilization',
        resolve: (value) => value.cpuUtilization,
    })
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.INFO,
        possession: AuthPossession.ANY,
    })
    public async cpuUtilizationSubscription() {
        const iterator = createSubscription(CPU_UTILIZATION);

        return {
            [Symbol.asyncIterator]: () => {
                this.subscriptionTracker.subscribe(CPU_UTILIZATION);
                return iterator[Symbol.asyncIterator]();
            },
            return: () => {
                this.subscriptionTracker.unsubscribe(CPU_UTILIZATION);
                return iterator.return();
            },
        };
    }
}

@Resolver(() => InfoCpu)
export class InfoCpuResolver {
    constructor(private readonly cpuDataService: CpuDataService) {}

    @ResolveField(() => Number, {
        description: 'CPU utilization in percent',
        nullable: true,
    })
    public async utilization(@Parent() cpu: InfoCpu): Promise<number> {
        const { currentLoad } = await this.cpuDataService.getCpuLoad();
        return currentLoad;
    }
}
