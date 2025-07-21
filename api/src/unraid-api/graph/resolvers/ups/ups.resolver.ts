import { Resolver, Query, Args, Mutation, Subscription } from '@nestjs/graphql';
import { UPSDevice } from './ups.model.js';
import { UPSConfigInput } from './ups.inputs.js';
import { PubSub } from 'graphql-subscriptions';
import { UPSService, UPSData } from './ups.service.js';

@Resolver(() => UPSDevice)
export class UPSResolver {
  constructor(
    private readonly upsService: UPSService,
    private readonly pubSub: PubSub,
  ) {}

  private createUPSDevice(upsData: UPSData, id: string): UPSDevice {
    return {
      id,
      name: upsData.MODEL || 'My UPS',
      model: upsData.MODEL || 'APC Back-UPS Pro 1500',
      status: upsData.STATUS || 'Online',
      battery: {
        chargeLevel: parseInt(upsData.BCHARGE, 10) || 100,
        estimatedRuntime: parseInt(upsData.TIMELEFT, 10) || 3600,
        health: 'Good',
      },
      power: {
        inputVoltage: parseFloat(upsData.LINEV) || 120.5,
        outputVoltage: parseFloat(upsData.OUTPUTV) || 120.5,
        loadPercentage: parseInt(upsData.LOADPCT, 10) || 25,
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
    return this.pubSub.asyncIterator('upsUpdates');
  }
}
