import { Field, ObjectType } from '@nestjs/graphql';

import { Onboarding } from '@app/unraid-api/graph/resolvers/customization/activation-code.model.js';
import { Theme } from '@app/unraid-api/graph/resolvers/customization/theme.model.js';
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
export class CustomizationMutations {
    @Field(() => Theme, { description: 'Update the UI theme (writes dynamix.cfg)' })
    setTheme!: Theme;

    @Field(() => String, { description: 'Update the display locale (language)' })
    setLocale!: string;
}

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
    @Field(() => Onboarding, {
        description: 'Mark onboarding as completed',
    })
    completeOnboarding!: Onboarding;

    @Field(() => Onboarding, {
        description: 'Reset onboarding progress (for testing)',
    })
    resetOnboarding!: Onboarding;

    @Field(() => Onboarding, {
        description: 'Override onboarding state for testing (in-memory only)',
    })
    setOnboardingOverride!: Onboarding;

    @Field(() => Onboarding, {
        description: 'Clear onboarding override state and reload from disk',
    })
    clearOnboardingOverride!: Onboarding;
}

@ObjectType({
    description: 'Unraid plugin management mutations',
})
export class UnraidPluginsMutations {
    @Field(() => PluginInstallOperation, {
        description: 'Install an Unraid plugin and track installation progress',
    })
    installPlugin!: PluginInstallOperation;

    @Field(() => PluginInstallOperation, {
        description: 'Install an Unraid language pack and track installation progress',
    })
    installLanguage!: PluginInstallOperation;
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
