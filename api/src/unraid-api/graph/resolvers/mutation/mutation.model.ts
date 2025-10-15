import { Field, ObjectType } from '@nestjs/graphql';

import { UpgradeInfo } from '@app/unraid-api/graph/resolvers/info/versions/versions.model.js';
import { RCloneRemote } from '@app/unraid-api/graph/resolvers/rclone/rclone.model.js';
import { PluginInstallOperation } from '@app/unraid-api/graph/resolvers/unraid-plugins/unraid-plugins.model.js';

/**
 * Important:
 *
 * When adding a new mutation, you must also add it to the RootMutations resolver
 *
 * @file src/unraid-api/graph/resolvers/mutation/mutation.resolver.ts
 */

@ObjectType()
export class ArrayMutations {}

@ObjectType()
export class DockerMutations {}

@ObjectType()
export class VmMutations {}

@ObjectType({
    description: 'API Key related mutations',
})
export class ApiKeyMutations {}

@ObjectType({
    description: 'Customization related mutations',
})
export class CustomizationMutations {}

@ObjectType({
    description: 'Parity check related mutations, WIP, response types and functionaliy will change',
})
export class ParityCheckMutations {}

@ObjectType({
    description: 'RClone related mutations',
})
export class RCloneMutations {
    @Field(() => RCloneRemote, { description: 'Create a new RClone remote' })
    createRCloneRemote!: RCloneRemote;

    @Field(() => Boolean, { description: 'Delete an existing RClone remote' })
    deleteRCloneRemote!: boolean;
}

@ObjectType({
    description: 'Onboarding related mutations',
})
export class OnboardingMutations {
    @Field(() => UpgradeInfo, {
        description: 'Mark an upgrade onboarding step as completed for the current OS version',
    })
    completeUpgradeStep!: UpgradeInfo;
}

@ObjectType({
    description: 'Unraid plugin management mutations',
})
export class UnraidPluginsMutations {
    @Field(() => PluginInstallOperation, {
        description: 'Install an Unraid plugin and track installation progress',
    })
    installPlugin!: PluginInstallOperation;
}

@ObjectType()
export class RootMutations {
    @Field(() => ArrayMutations, { description: 'Array related mutations' })
    array: ArrayMutations = new ArrayMutations();

    @Field(() => DockerMutations, { description: 'Docker related mutations' })
    docker: DockerMutations = new DockerMutations();

    @Field(() => VmMutations, { description: 'VM related mutations' })
    vm: VmMutations = new VmMutations();

    @Field(() => ApiKeyMutations, { description: 'API Key related mutations' })
    apiKey: ApiKeyMutations = new ApiKeyMutations();

    @Field(() => CustomizationMutations, { description: 'Customization related mutations' })
    customization: CustomizationMutations = new CustomizationMutations();

    @Field(() => ParityCheckMutations, { description: 'Parity check related mutations' })
    parityCheck: ParityCheckMutations = new ParityCheckMutations();

    @Field(() => RCloneMutations, { description: 'RClone related mutations' })
    rclone: RCloneMutations = new RCloneMutations();

    @Field(() => OnboardingMutations, { description: 'Onboarding related mutations' })
    onboarding: OnboardingMutations = new OnboardingMutations();

    @Field(() => UnraidPluginsMutations, { description: 'Unraid plugin related mutations' })
    unraidPlugins: UnraidPluginsMutations = new UnraidPluginsMutations();
}
