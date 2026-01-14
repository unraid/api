import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';

import { PubSub } from 'graphql-subscriptions';

import { UPSConfigInput } from '@app/unraid-api/graph/resolvers/ups/ups.inputs.js';
import { UPSConfiguration, UPSDevice } from '@app/unraid-api/graph/resolvers/ups/ups.model.js';
import { UPSData, UPSService } from '@app/unraid-api/graph/resolvers/ups/ups.service.js';

@Resolver(() => UPSDevice)
export class UPSResolver {
    constructor(
        private readonly upsService: UPSService,
        private readonly pubSub: PubSub
    ) {}

    private createUPSDevice(upsData: UPSData, id: string): UPSDevice {
        const loadPercentage = parseInt(upsData.LOADPCT || '25', 10);
        const nominalPower = upsData.NOMPOWER ? parseInt(upsData.NOMPOWER, 10) : undefined;
        const currentPower =
            nominalPower !== undefined
                ? parseFloat(((nominalPower * loadPercentage) / 100).toFixed(2))
                : undefined;

        return {
            id,
            name: upsData.MODEL || 'My UPS',
            model: upsData.MODEL || 'APC Back-UPS Pro 1500',
            status: upsData.STATUS || 'Online',
            battery: {
                chargeLevel: parseInt(upsData.BCHARGE || '100', 10),
                // Convert TIMELEFT from minutes (apcupsd format) to seconds
                estimatedRuntime: Math.round(parseFloat(upsData.TIMELEFT || '60') * 60),
                health: 'Good',
            },
            power: {
                inputVoltage: parseFloat(upsData.LINEV || '120.5'),
                outputVoltage: parseFloat(upsData.OUTPUTV || '120.5'),
                loadPercentage,
                nominalPower,
                currentPower,
            },
        };
    }

    @Query(() => [UPSDevice])
    async upsDevices(): Promise<UPSDevice[]> {
        const upsData = await this.upsService.getUPSData();
        // Assuming single UPS for now, but this could be expanded to support multiple devices
        return [this.createUPSDevice(upsData, upsData.MODEL || 'ups1')];
    }

    @Query(() => UPSDevice, { nullable: true })
    async upsDeviceById(@Args('id') id: string): Promise<UPSDevice | null> {
        const upsData = await this.upsService.getUPSData();
        const deviceId = upsData.MODEL || 'ups1';
        if (id === deviceId) {
            return this.createUPSDevice(upsData, id);
        }
        return null;
    }

    @Query(() => UPSConfiguration)
    async upsConfiguration(): Promise<UPSConfiguration> {
        const config = await this.upsService.getCurrentConfig();
        return {
            service: config.SERVICE,
            upsCable: config.UPSCABLE,
            customUpsCable: config.CUSTOMUPSCABLE,
            upsType: config.UPSTYPE,
            device: config.DEVICE,
            overrideUpsCapacity: config.OVERRIDE_UPS_CAPACITY,
            batteryLevel: config.BATTERYLEVEL,
            minutes: config.MINUTES,
            timeout: config.TIMEOUT,
            killUps: config.KILLUPS,
            nisIp: config.NISIP,
            netServer: config.NETSERVER,
            upsName: config.UPSNAME,
            modelName: config.MODELNAME,
        };
    }

    @Mutation(() => Boolean)
    async configureUps(@Args('config') config: UPSConfigInput): Promise<boolean> {
        await this.upsService.configureUPS(config);
        const updatedData = await this.upsService.getUPSData();
        const newDevice = this.createUPSDevice(updatedData, updatedData.MODEL || 'ups1');
        this.pubSub.publish('upsUpdates', { upsUpdates: newDevice });
        return true;
    }

    @Subscription(() => UPSDevice)
    upsUpdates() {
        return this.pubSub.asyncIterableIterator('upsUpdates');
    }
}
