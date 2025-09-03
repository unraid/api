import { ResolveField, Resolver } from '@nestjs/graphql';

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

    @ResolveField(() => [InfoGpu])
    public async gpu(): Promise<InfoGpu[]> {
        return this.devicesService.generateGpu();
    }

    @ResolveField(() => [InfoNetwork])
    public async network(): Promise<InfoNetwork[]> {
        return this.devicesService.generateNetwork();
    }

    @ResolveField(() => [InfoPci])
    public async pci(): Promise<InfoPci[]> {
        return this.devicesService.generatePci();
    }

    @ResolveField(() => [InfoUsb])
    public async usb(): Promise<InfoUsb[]> {
        return this.devicesService.generateUsb();
    }
}
