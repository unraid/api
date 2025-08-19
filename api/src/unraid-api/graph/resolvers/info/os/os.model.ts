import { Field, ObjectType } from '@nestjs/graphql';

import { Node } from '@unraid/shared/graphql.model.js';

@ObjectType({ implements: () => Node })
export class InfoOs extends Node {
    @Field(() => String, { nullable: true, description: 'Operating system platform' })
    platform?: string;

    @Field(() => String, { nullable: true, description: 'Linux distribution name' })
    distro?: string;

    @Field(() => String, { nullable: true, description: 'OS release version' })
    release?: string;

    @Field(() => String, { nullable: true, description: 'OS codename' })
    codename?: string;

    @Field(() => String, { nullable: true, description: 'Kernel version' })
    kernel?: string;

    @Field(() => String, { nullable: true, description: 'OS architecture' })
    arch?: string;

    @Field(() => String, { nullable: true, description: 'Hostname' })
    hostname?: string;

    @Field(() => String, { nullable: true, description: 'Fully qualified domain name' })
    fqdn?: string;

    @Field(() => String, { nullable: true, description: 'OS build identifier' })
    build?: string;

    @Field(() => String, { nullable: true, description: 'Service pack version' })
    servicepack?: string;

    @Field(() => String, { nullable: true, description: 'Boot time ISO string' })
    uptime?: string;

    @Field(() => String, { nullable: true, description: 'OS logo name' })
    logofile?: string;

    @Field(() => String, { nullable: true, description: 'OS serial number' })
    serial?: string;

    @Field(() => Boolean, { nullable: true, description: 'OS started via UEFI' })
    uefi?: boolean | null;
}
