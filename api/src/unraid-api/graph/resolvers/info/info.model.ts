import { Field, GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql';

import { Node } from '@unraid/shared/graphql.model.js';

import { InfoCpu } from '@app/unraid-api/graph/resolvers/info/cpu/cpu.model.js';
import { InfoDevices } from '@app/unraid-api/graph/resolvers/info/devices/devices.model.js';
import { InfoDisplay } from '@app/unraid-api/graph/resolvers/info/display/display.model.js';
import { InfoMemory } from '@app/unraid-api/graph/resolvers/info/memory/memory.model.js';
import { InfoNetworkInterface } from '@app/unraid-api/graph/resolvers/info/network/network.model.js';
import { InfoOs } from '@app/unraid-api/graph/resolvers/info/os/os.model.js';
import { InfoBaseboard, InfoSystem } from '@app/unraid-api/graph/resolvers/info/system/system.model.js';
import { InfoVersions } from '@app/unraid-api/graph/resolvers/info/versions/versions.model.js';

@ObjectType({ implements: () => Node })
export class Info extends Node {
    @Field(() => GraphQLISODateTime, { description: 'Current server time' })
    time!: Date;

    @Field(() => InfoBaseboard, { description: 'Motherboard information' })
    baseboard!: InfoBaseboard;

    @Field(() => InfoCpu, { description: 'CPU information' })
    cpu!: InfoCpu;

    @Field(() => InfoDevices, { description: 'Device information' })
    devices!: InfoDevices;

    @Field(() => InfoDisplay, { description: 'Display configuration' })
    display!: InfoDisplay;

    @Field(() => ID, { nullable: true, description: 'Machine ID' })
    machineId?: string;

    @Field(() => InfoMemory, { description: 'Memory information' })
    memory!: InfoMemory;

    @Field(() => InfoOs, { description: 'Operating system information' })
    os!: InfoOs;

    @Field(() => InfoSystem, { description: 'System information' })
    system!: InfoSystem;

    @Field(() => InfoVersions, { description: 'Software versions' })
    versions!: InfoVersions;

    @Field(() => [InfoNetworkInterface], { description: 'Network interfaces' })
    networkInterfaces!: InfoNetworkInterface[];

    @Field(() => InfoNetworkInterface, { nullable: true, description: 'Primary management interface' })
    primaryNetwork?: InfoNetworkInterface;
}
