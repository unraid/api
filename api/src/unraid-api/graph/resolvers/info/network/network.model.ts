import { Field, Int, ObjectType } from '@nestjs/graphql';

import { Node } from '@unraid/shared/graphql.model.js';

@ObjectType({ implements: () => Node })
export class InfoNetworkInterface extends Node {
    @Field({ description: 'Interface name (e.g. eth0)' })
    name!: string;

    @Field({ nullable: true, description: 'Interface description/label' })
    description?: string;

    @Field({ nullable: true, description: 'MAC Address' })
    macAddress?: string;

    @Field({ nullable: true, description: 'Connection status' })
    status?: string;

    // IPv4
    @Field({ nullable: true, description: 'IPv4 Protocol mode' })
    protocol?: string;

    @Field({ nullable: true, description: 'IPv4 Address' })
    ipAddress?: string;

    @Field({ nullable: true, description: 'IPv4 Netmask' })
    netmask?: string;

    @Field({ nullable: true, description: 'IPv4 Gateway' })
    gateway?: string;

    @Field({ nullable: true, description: 'Using DHCP for IPv4' })
    useDhcp?: boolean;

    // IPv6
    @Field({ nullable: true, description: 'IPv6 Address' })
    ipv6Address?: string;

    @Field({ nullable: true, description: 'IPv6 Netmask' })
    ipv6Netmask?: string;

    @Field({ nullable: true, description: 'IPv6 Gateway' })
    ipv6Gateway?: string;

    @Field({ nullable: true, description: 'Using DHCP for IPv6' })
    useDhcp6?: boolean;
}
