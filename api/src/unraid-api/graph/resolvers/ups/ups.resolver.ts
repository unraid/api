import { Resolver, Query, Args, Mutation, Subscription } from '@nestjs/graphql';
import { UPSDevice } from './ups.model';
import { UPSConfigInput } from './ups.inputs';
import { PubSub } from 'graphql-subscriptions';
import { UPSService } from './ups.service';

const pubSub = new PubSub();

@Resolver(() => UPSDevice)
export class UPSResolver {
  constructor(private readonly upsService: UPSService) {}

  @Query(() => [UPSDevice])
  async upsDevices(): Promise<UPSDevice[]> {
    const upsData = await this.upsService.getUPSData();
    return [
      {
        id: 'ups1',
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
      },
    ];
  }

  @Query(() => UPSDevice, { nullable: true })
  async upsDeviceById(@Args('id') id: string): Promise<UPSDevice | null> {
    const upsData = await this.upsService.getUPSData();
    if (id === 'ups1') {
      return {
        id: 'ups1',
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
    return null;
  }

  @Mutation(() => Boolean)
  async configureUps(@Args('config') config: UPSConfigInput): Promise<boolean> {
    await this.upsService.configureUPS(config);
    const updatedData = await this.upsService.getUPSData();
    const newDevice = {
        id: 'ups1',
        name: updatedData.MODEL || 'My UPS',
        model: updatedData.MODEL || 'APC Back-UPS Pro 1500',
        status: updatedData.STATUS || 'Online',
        battery: {
          chargeLevel: parseInt(updatedData.BCHARGE, 10) || 100,
          estimatedRuntime: parseInt(updatedData.TIMELEFT, 10) || 3600,
          health: 'Good',
        },
        power: {
          inputVoltage: parseFloat(updatedData.LINEV) || 120.5,
          outputVoltage: parseFloat(updatedData.OUTPUTV) || 120.5,
          loadPercentage: parseInt(updatedData.LOADPCT, 10) || 25,
        },
    };
    pubSub.publish('upsUpdates', { upsUpdates: newDevice });
    return true;
  }

  @Subscription(() => UPSDevice)
  upsUpdates() {
    return pubSub.asyncIterator('upsUpdates');
  }
}
