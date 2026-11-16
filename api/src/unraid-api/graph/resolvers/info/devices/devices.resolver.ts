import { ResolveField, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import {
    InfoDevices,
    InfoGpu,
    InfoNetwork,
    InfoPci,
    InfoUsb,
} from '@app/unraid-api/graph/resolvers/info/devices/devices.model.js';
import { DevicesService } from '@app/unraid-api/graph/resolvers/info/devices/devices.service.js';

@Resolver(() => InfoDevices)
export class DevicesResolver {
    constructor(private readonly devicesService: DevicesService) {}

    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.INFO,
    })
    @ResolveField(() => [InfoGpu])
    public async gpu(): Promise<InfoGpu[]> {
        return this.devicesService.generateGpu();
    }

    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.INFO,
    })
    @ResolveField(() => [InfoNetwork])
    public async network(): Promise<InfoNetwork[]> {
        return this.devicesService.generateNetwork();
    }

    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.INFO,
    })
    @ResolveField(() => [InfoPci])
    public async pci(): Promise<InfoPci[]> {
        return this.devicesService.generatePci();
    }

    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.INFO,
    })
    @ResolveField(() => [InfoUsb])
    public async usb(): Promise<InfoUsb[]> {
        return this.devicesService.generateUsb();
    }
}
