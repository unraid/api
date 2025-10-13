import { Field, ObjectType } from '@nestjs/graphql';

import { Node } from '@unraid/shared/graphql.model.js';

import { ActivationOnboardingStepId } from '@app/unraid-api/graph/resolvers/customization/activation-code.model.js';

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
export class UpgradeStep {
    @Field(() => String, { description: 'Identifier of the onboarding step' })
    id!: string;

    @Field(() => Boolean, {
        description: 'Whether the step is required to continue',
        defaultValue: false,
    })
    required!: boolean;

    @Field(() => String, {
        nullable: true,
        description: 'Version of Unraid when this step was introduced',
    })
    introducedIn?: string;

    @Field(() => String, { description: 'Display title for the onboarding step' })
    title!: string;

    @Field(() => String, { description: 'Display description for the onboarding step' })
    description!: string;

    @Field(() => String, {
        nullable: true,
        description: 'Icon identifier for the onboarding step',
    })
    icon?: string;
}

@ObjectType()
export class UpgradeInfo {
    @Field(() => Boolean, { description: 'Whether the OS version has changed since last boot' })
    isUpgrade!: boolean;

    @Field(() => String, { nullable: true, description: 'Previous OS version before upgrade' })
    previousVersion?: string;

    @Field(() => String, { nullable: true, description: 'Current OS version' })
    currentVersion?: string;

    @Field(() => [String], {
        description: 'Onboarding step identifiers completed for the current OS version',
        defaultValue: [],
    })
    completedSteps!: string[];

    @Field(() => [UpgradeStep], {
        description: 'Onboarding step definitions applicable to the current upgrade path',
        defaultValue: [],
    })
    steps!: UpgradeStep[];
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
