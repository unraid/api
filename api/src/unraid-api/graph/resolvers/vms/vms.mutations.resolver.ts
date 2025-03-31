import { Args, ResolveField, Resolver } from '@nestjs/graphql';
import { VmsService } from '@app/unraid-api/graph/resolvers/vms/vms.service.js';

@Resolver('VmMutations')
export class VmMutationsResolver {
    constructor(private readonly vmsService: VmsService) {}

    @ResolveField('startVm')
    async startVm(@Args('id') id: string): Promise<boolean> {
        return this.vmsService.startVm(id);
    }

    @ResolveField('stopVm')
    async stopVm(@Args('id') id: string): Promise<boolean> {
        return this.vmsService.stopVm(id);
    }

    @ResolveField('pauseVm')
    async pauseVm(@Args('id') id: string): Promise<boolean> {
        return this.vmsService.pauseVm(id);
    }

    @ResolveField('resumeVm')
    async resumeVm(@Args('id') id: string): Promise<boolean> {
        return this.vmsService.resumeVm(id);
    }

    @ResolveField('forceStopVm')
    async forceStopVm(@Args('id') id: string): Promise<boolean> {
        return this.vmsService.forceStopVm(id);
    }

    @ResolveField('rebootVm')
    async rebootVm(@Args('id') id: string): Promise<boolean> {
        return this.vmsService.rebootVm(id);
    }

    @ResolveField('resetVm')
    async resetVm(@Args('id') id: string): Promise<boolean> {
        return this.vmsService.resetVm(id);
    }
}
