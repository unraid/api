import { ResolveField, Resolver } from '@nestjs/graphql';

import { DevicesService } from '@app/unraid-api/graph/resolvers/info/devices.service.js';
import { Devices, Gpu, Pci, Usb } from '@app/unraid-api/graph/resolvers/info/info.model.js';

@Resolver(() => Devices)
export class DevicesResolver {
    constructor(private readonly devicesService: DevicesService) {}

    @ResolveField(() => [Gpu])
    public async gpu(): Promise<Gpu[]> {
        return this.devicesService.generateGpu();
    }

    @ResolveField(() => [Pci])
    public async pci(): Promise<Pci[]> {
        return this.devicesService.generatePci();
    }

    @ResolveField(() => [Usb])
    public async usb(): Promise<Usb[]> {
        return this.devicesService.generateUsb();
    }
}
