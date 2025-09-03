import { Field, ObjectType } from '@nestjs/graphql';

import { Node } from '@unraid/shared/graphql.model.js';

@ObjectType({ implements: () => Node })
export class InfoGpu extends Node {
    @Field(() => String, { description: 'GPU type/manufacturer' })
    type!: string;

    @Field(() => String, { description: 'GPU type identifier' })
    typeid!: string;

    @Field(() => Boolean, { description: 'Whether GPU is blacklisted' })
    blacklisted!: boolean;

    @Field(() => String, { description: 'Device class' })
    class!: string;

    @Field(() => String, { description: 'Product ID' })
    productid!: string;

    @Field(() => String, { nullable: true, description: 'Vendor name' })
    vendorname?: string;
}

@ObjectType({ implements: () => Node })
export class InfoNetwork extends Node {
    @Field(() => String, { description: 'Network interface name' })
    iface!: string;

    @Field(() => String, { nullable: true, description: 'Network interface model' })
    model?: string;

    @Field(() => String, { nullable: true, description: 'Network vendor' })
    vendor?: string;

    @Field(() => String, { nullable: true, description: 'MAC address' })
    mac?: string;

    @Field(() => Boolean, { nullable: true, description: 'Virtual interface flag' })
    virtual?: boolean;

    @Field(() => String, { nullable: true, description: 'Network speed' })
    speed?: string;

    @Field(() => Boolean, { nullable: true, description: 'DHCP enabled flag' })
    dhcp?: boolean;
}

@ObjectType({ implements: () => Node })
export class InfoPci extends Node {
    @Field(() => String, { description: 'Device type/manufacturer' })
    type!: string;

    @Field(() => String, { description: 'Type identifier' })
    typeid!: string;

    @Field(() => String, { nullable: true, description: 'Vendor name' })
    vendorname?: string;

    @Field(() => String, { description: 'Vendor ID' })
    vendorid!: string;

    @Field(() => String, { nullable: true, description: 'Product name' })
    productname?: string;

    @Field(() => String, { description: 'Product ID' })
    productid!: string;

    @Field(() => String, { description: 'Blacklisted status' })
    blacklisted!: string;

    @Field(() => String, { description: 'Device class' })
    class!: string;
}

@ObjectType({ implements: () => Node })
export class InfoUsb extends Node {
    @Field(() => String, { description: 'USB device name' })
    name!: string;

    @Field(() => String, { nullable: true, description: 'USB bus number' })
    bus?: string;

    @Field(() => String, { nullable: true, description: 'USB device number' })
    device?: string;
}

@ObjectType({ implements: () => Node })
export class InfoDevices extends Node {
    @Field(() => [InfoGpu], { nullable: true, description: 'List of GPU devices' })
    gpu?: InfoGpu[];

    @Field(() => [InfoNetwork], { nullable: true, description: 'List of network interfaces' })
    network?: InfoNetwork[];

    @Field(() => [InfoPci], { nullable: true, description: 'List of PCI devices' })
    pci?: InfoPci[];

    @Field(() => [InfoUsb], { nullable: true, description: 'List of USB devices' })
    usb?: InfoUsb[];
}
