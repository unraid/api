import { Field, Int, ObjectType } from '@nestjs/graphql';

import { Node } from '@unraid/shared/graphql.model.js';

@ObjectType({ description: 'IPv4 address assigned to a network interface' })
export class InfoNetworkIpv4Address {
    @Field({ description: 'IPv4 address' })
    address!: string;

    @Field({ description: 'IPv4 netmask' })
    netmask!: string;
}

@ObjectType({ description: 'IPv6 address assigned to a network interface' })
export class InfoNetworkIpv6Address {
    @Field({ description: 'IPv6 address' })
    address!: string;

    @Field(() => Int, { nullable: true, description: 'IPv6 prefix length' })
    prefixLength?: number;
}

@ObjectType({ implements: () => Node })
export class InfoNetworkInterface extends Node {
    @Field({ description: 'Interface name (e.g. eth0)' })
    name!: string;

    @Field({ nullable: true, description: 'Interface description/label' })
    description?: string;

    @Field({ nullable: true, description: 'MAC Address' })
    macAddress?: string;

    @Field(() => Int, { nullable: true, description: 'Maximum transmission unit' })
    mtu?: number;

    @Field(() => Int, { nullable: true, description: 'Link speed in Mbps' })
    speed?: number;

    @Field({ nullable: true, description: 'Link duplex mode' })
    duplex?: string;

    @Field({ nullable: true, description: 'Whether this is an internal interface' })
    internal?: boolean;

    @Field({ nullable: true, description: 'Whether this is a virtual interface' })
    virtual?: boolean;

    @Field({ nullable: true, description: 'Operational state' })
    operstate?: string;

    @Field({ nullable: true, description: 'Interface type' })
    type?: string;

    @Field(() => Int, { nullable: true, description: 'VLAN identifier parsed from the interface name' })
    vlanId?: number;

    @Field(() => [InfoNetworkIpv4Address], { description: 'IPv4 addresses assigned to this interface' })
    ipv4Addresses!: InfoNetworkIpv4Address[];

    @Field(() => [InfoNetworkIpv6Address], { description: 'IPv6 addresses assigned to this interface' })
    ipv6Addresses!: InfoNetworkIpv6Address[];

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
