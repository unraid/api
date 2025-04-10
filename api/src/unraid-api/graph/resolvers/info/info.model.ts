import { Field, Float, GraphQLISODateTime, ID, Int, ObjectType } from '@nestjs/graphql';

import { Node } from '@app/unraid-api/graph/resolvers/base.model.js';
import { Temperature, Theme } from '@app/unraid-api/graph/resolvers/info/display.model.js';

@ObjectType()
export class InfoApps implements Node {
    @Field(() => ID)
    id!: string;

    @Field(() => Int, { description: 'How many docker containers are installed' })
    installed!: number;

    @Field(() => Int, { description: 'How many docker containers are running' })
    started!: number;
}

@ObjectType()
export class Baseboard implements Node {
    @Field(() => ID)
    id!: string;

    @Field(() => String)
    manufacturer!: string;

    @Field(() => String, { nullable: true })
    model?: string;

    @Field(() => String, { nullable: true })
    version?: string;

    @Field(() => String, { nullable: true })
    serial?: string;

    @Field(() => String, { nullable: true })
    assetTag?: string;
}

@ObjectType()
export class InfoCpu implements Node {
    @Field(() => ID)
    id!: string;

    @Field(() => String)
    manufacturer!: string;

    @Field(() => String)
    brand!: string;

    @Field(() => String)
    vendor!: string;

    @Field(() => String)
    family!: string;

    @Field(() => String)
    model!: string;

    @Field(() => Int)
    stepping!: number;

    @Field(() => String)
    revision!: string;

    @Field(() => String, { nullable: true })
    voltage?: string;

    @Field(() => Float)
    speed!: number;

    @Field(() => Float)
    speedmin!: number;

    @Field(() => Float)
    speedmax!: number;

    @Field(() => Int)
    threads!: number;

    @Field(() => Int)
    cores!: number;

    @Field(() => Int)
    processors!: number;

    @Field(() => String)
    socket!: string;

    @Field(() => Object)
    cache!: Record<string, any>;

    @Field(() => [String])
    flags!: string[];
}

@ObjectType()
export class Gpu implements Node {
    @Field(() => ID)
    id!: string;

    @Field(() => String)
    type!: string;

    @Field(() => String)
    typeid!: string;

    @Field(() => String)
    vendorname!: string;

    @Field(() => String)
    productid!: string;

    @Field(() => Boolean)
    blacklisted!: boolean;

    @Field(() => String)
    class!: string;
}

@ObjectType()
export class Network implements Node {
    @Field(() => ID)
    id!: string;

    @Field(() => String, { nullable: true })
    iface?: string;

    @Field(() => String, { nullable: true })
    ifaceName?: string;

    @Field(() => String, { nullable: true })
    ipv4?: string;

    @Field(() => String, { nullable: true })
    ipv6?: string;

    @Field(() => String, { nullable: true })
    mac?: string;

    @Field(() => String, { nullable: true })
    internal?: string;

    @Field(() => String, { nullable: true })
    operstate?: string;

    @Field(() => String, { nullable: true })
    type?: string;

    @Field(() => String, { nullable: true })
    duplex?: string;

    @Field(() => String, { nullable: true })
    mtu?: string;

    @Field(() => String, { nullable: true })
    speed?: string;

    @Field(() => String, { nullable: true })
    carrierChanges?: string;
}

@ObjectType()
export class Pci implements Node {
    @Field(() => ID)
    id!: string;

    @Field(() => String, { nullable: true })
    type?: string;

    @Field(() => String, { nullable: true })
    typeid?: string;

    @Field(() => String, { nullable: true })
    vendorname?: string;

    @Field(() => String, { nullable: true })
    vendorid?: string;

    @Field(() => String, { nullable: true })
    productname?: string;

    @Field(() => String, { nullable: true })
    productid?: string;

    @Field(() => String, { nullable: true })
    blacklisted?: string;

    @Field(() => String, { nullable: true })
    class?: string;
}

@ObjectType()
export class Usb {
    @Field(() => ID)
    id!: string;

    @Field(() => String, { nullable: true })
    name?: string;
}

@ObjectType()
export class Devices implements Node {
    @Field(() => ID)
    id!: string;

    @Field(() => [Gpu])
    gpu!: Gpu[];

    @Field(() => [Pci])
    pci!: Pci[];

    @Field(() => [Usb])
    usb!: Usb[];
}

@ObjectType()
export class Display implements Node {
    @Field(() => ID)
    id!: string;

    @Field(() => String, { nullable: true })
    date?: string;

    @Field(() => String, { nullable: true })
    number?: string;

    @Field(() => Boolean, { nullable: true })
    scale?: boolean;

    @Field(() => Boolean, { nullable: true })
    tabs?: boolean;

    @Field(() => String, { nullable: true })
    users?: string;

    @Field(() => Boolean, { nullable: true })
    resize?: boolean;

    @Field(() => Boolean, { nullable: true })
    wwn?: boolean;

    @Field(() => Boolean, { nullable: true })
    total?: boolean;

    @Field(() => Boolean, { nullable: true })
    usage?: boolean;

    @Field(() => String, { nullable: true })
    banner?: string;

    @Field(() => String, { nullable: true })
    dashapps?: string;

    @Field(() => Theme, { nullable: true })
    theme?: Theme;

    @Field(() => Boolean, { nullable: true })
    text?: boolean;

    @Field(() => Temperature, { nullable: true })
    unit?: Temperature;

    @Field(() => Int, { nullable: true })
    warning?: number;

    @Field(() => Int, { nullable: true })
    critical?: number;

    @Field(() => Int, { nullable: true })
    hot?: number;

    @Field(() => Int, { nullable: true })
    max?: number;

    @Field(() => String, { nullable: true })
    locale?: string;
}

export enum MemoryType {
    DDR2 = 'DDR2',
    DDR3 = 'DDR3',
    DDR4 = 'DDR4',
}

export enum MemoryFormFactor {
    DIMM = 'DIMM',
}

@ObjectType()
export class MemoryLayout {
    @Field(() => Int)
    size!: number;

    @Field(() => String, { nullable: true })
    bank?: string;

    @Field(() => MemoryType, { nullable: true })
    type?: MemoryType;

    @Field(() => Int, { nullable: true })
    clockSpeed?: number;

    @Field(() => MemoryFormFactor, { nullable: true })
    formFactor?: MemoryFormFactor;

    @Field(() => String, { nullable: true })
    manufacturer?: string;

    @Field(() => String, { nullable: true })
    partNum?: string;

    @Field(() => String, { nullable: true })
    serialNum?: string;

    @Field(() => Int, { nullable: true })
    voltageConfigured?: number;

    @Field(() => Int, { nullable: true })
    voltageMin?: number;

    @Field(() => Int, { nullable: true })
    voltageMax?: number;
}

@ObjectType()
export class InfoMemory implements Node {
    @Field(() => ID)
    id!: string;

    @Field(() => Int)
    max!: number;

    @Field(() => Int)
    total!: number;

    @Field(() => Int)
    free!: number;

    @Field(() => Int)
    used!: number;

    @Field(() => Int)
    active!: number;

    @Field(() => Int)
    available!: number;

    @Field(() => Int)
    buffcache!: number;

    @Field(() => Int)
    swaptotal!: number;

    @Field(() => Int)
    swapused!: number;

    @Field(() => Int)
    swapfree!: number;

    @Field(() => [MemoryLayout])
    layout!: MemoryLayout[];
}

@ObjectType()
export class Os implements Node {
    @Field(() => ID)
    id!: string;

    @Field(() => String, { nullable: true })
    platform?: string;

    @Field(() => String, { nullable: true })
    distro?: string;

    @Field(() => String, { nullable: true })
    release?: string;

    @Field(() => String, { nullable: true })
    codename?: string;

    @Field(() => String, { nullable: true })
    kernel?: string;

    @Field(() => String, { nullable: true })
    arch?: string;

    @Field(() => String, { nullable: true })
    hostname?: string;

    @Field(() => String, { nullable: true })
    codepage?: string;

    @Field(() => String, { nullable: true })
    logofile?: string;

    @Field(() => String, { nullable: true })
    serial?: string;

    @Field(() => String, { nullable: true })
    build?: string;

    @Field(() => String, { nullable: true })
    uptime?: string;
}

@ObjectType()
export class System implements Node {
    @Field(() => ID)
    id!: string;

    @Field(() => String, { nullable: true })
    manufacturer?: string;

    @Field(() => String, { nullable: true })
    model?: string;

    @Field(() => String, { nullable: true })
    version?: string;

    @Field(() => String, { nullable: true })
    serial?: string;

    @Field(() => String, { nullable: true })
    uuid?: string;

    @Field(() => String, { nullable: true })
    sku?: string;
}

@ObjectType()
export class Versions implements Node {
    @Field(() => ID)
    id!: string;

    @Field(() => String, { nullable: true })
    kernel?: string;

    @Field(() => String, { nullable: true })
    openssl?: string;

    @Field(() => String, { nullable: true })
    systemOpenssl?: string;

    @Field(() => String, { nullable: true })
    systemOpensslLib?: string;

    @Field(() => String, { nullable: true })
    node?: string;

    @Field(() => String, { nullable: true })
    v8?: string;

    @Field(() => String, { nullable: true })
    npm?: string;

    @Field(() => String, { nullable: true })
    yarn?: string;

    @Field(() => String, { nullable: true })
    pm2?: string;

    @Field(() => String, { nullable: true })
    gulp?: string;

    @Field(() => String, { nullable: true })
    grunt?: string;

    @Field(() => String, { nullable: true })
    git?: string;

    @Field(() => String, { nullable: true })
    tsc?: string;

    @Field(() => String, { nullable: true })
    mysql?: string;

    @Field(() => String, { nullable: true })
    redis?: string;

    @Field(() => String, { nullable: true })
    mongodb?: string;

    @Field(() => String, { nullable: true })
    apache?: string;

    @Field(() => String, { nullable: true })
    nginx?: string;

    @Field(() => String, { nullable: true })
    php?: string;

    @Field(() => String, { nullable: true })
    docker?: string;

    @Field(() => String, { nullable: true })
    postfix?: string;

    @Field(() => String, { nullable: true })
    postgresql?: string;

    @Field(() => String, { nullable: true })
    perl?: string;

    @Field(() => String, { nullable: true })
    python?: string;

    @Field(() => String, { nullable: true })
    gcc?: string;

    @Field(() => String, { nullable: true })
    unraid?: string;
}

@ObjectType()
export class Info implements Node {
    @Field(() => ID)
    id!: string;

    @Field(() => InfoApps, { description: 'Count of docker containers' })
    apps!: InfoApps;

    @Field(() => Baseboard)
    baseboard!: Baseboard;

    @Field(() => InfoCpu)
    cpu!: InfoCpu;

    @Field(() => Devices)
    devices!: Devices;

    @Field(() => Display)
    display!: Display;

    @Field(() => ID, { description: 'Machine ID', nullable: true })
    machineId?: string;

    @Field(() => InfoMemory)
    memory!: InfoMemory;

    @Field(() => Os)
    os!: Os;

    @Field(() => System)
    system!: System;

    @Field(() => GraphQLISODateTime)
    time!: Date;

    @Field(() => Versions)
    versions!: Versions;
}
