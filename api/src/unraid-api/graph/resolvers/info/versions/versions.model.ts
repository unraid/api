import { Field, ObjectType } from '@nestjs/graphql';

import { Node } from '@unraid/shared/graphql.model.js';

@ObjectType()
export class CoreVersions {
    @Field(() => String, { nullable: true, description: 'Unraid version' })
    unraid?: string;

    @Field(() => String, { nullable: true, description: 'Unraid API version' })
    api?: string;

    @Field(() => String, { nullable: true, description: 'Kernel version' })
    kernel?: string;
}

@ObjectType()
export class PackageVersions {
    @Field(() => String, { nullable: true, description: 'OpenSSL version' })
    openssl?: string;

    @Field(() => String, { nullable: true, description: 'Node.js version' })
    node?: string;

    @Field(() => String, { nullable: true, description: 'npm version' })
    npm?: string;

    @Field(() => String, { nullable: true, description: 'pm2 version' })
    pm2?: string;

    @Field(() => String, { nullable: true, description: 'Git version' })
    git?: string;

    @Field(() => String, { nullable: true, description: 'nginx version' })
    nginx?: string;

    @Field(() => String, { nullable: true, description: 'PHP version' })
    php?: string;

    @Field(() => String, { nullable: true, description: 'Docker version' })
    docker?: string;
}

@ObjectType()
export class UpgradeInfo {
    @Field(() => Boolean, { description: 'Whether the OS version has changed since last boot' })
    isUpgrade!: boolean;

    @Field(() => String, { nullable: true, description: 'Previous OS version before upgrade' })
    previousVersion?: string;

    @Field(() => String, { nullable: true, description: 'Current OS version' })
    currentVersion?: string;
}

@ObjectType({ implements: () => Node })
export class InfoVersions extends Node {
    @Field(() => CoreVersions, { description: 'Core system versions' })
    core!: CoreVersions;

    @Field(() => PackageVersions, { nullable: true, description: 'Software package versions' })
    packages?: PackageVersions;

    @Field(() => UpgradeInfo, { description: 'OS upgrade information' })
    upgrade!: UpgradeInfo;
}
