import { Args, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import type { OnboardingOverrideState } from '@app/unraid-api/config/onboarding-override.model.js';
import { OnboardingOverrideService } from '@app/unraid-api/config/onboarding-override.service.js';
import { Onboarding } from '@app/unraid-api/graph/resolvers/customization/activation-code.model.js';
import { OnboardingService } from '@app/unraid-api/graph/resolvers/customization/onboarding.service.js';
import { OnboardingMutations } from '@app/unraid-api/graph/resolvers/mutation/mutation.model.js';
import { OnboardingInternalBootService } from '@app/unraid-api/graph/resolvers/onboarding/onboarding-internal-boot.service.js';
import {
    CreateInternalBootPoolInput,
    OnboardingInternalBootContext,
    OnboardingInternalBootResult,
    OnboardingOverrideInput,
    SaveOnboardingDraftInput,
} from '@app/unraid-api/graph/resolvers/onboarding/onboarding.model.js';

@Resolver(() => OnboardingMutations)
export class OnboardingMutationsResolver {
    constructor(
        private readonly onboardingOverrides: OnboardingOverrideService,
        private readonly onboardingService: OnboardingService,
        private readonly onboardingInternalBootService: OnboardingInternalBootService
    ) {}

    @ResolveField(() => Onboarding, {
        description: 'Marks the onboarding flow as completed',
    })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.WELCOME,
    })
    async completeOnboarding(): Promise<Onboarding> {
        await this.onboardingService.markOnboardingCompleted();
        return this.onboardingService.getOnboardingResponse();
    }

    @ResolveField(() => Onboarding, {
        description: 'Reset onboarding progress (for testing)',
    })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.WELCOME,
    })
    async resetOnboarding(): Promise<Onboarding> {
        await this.onboardingService.resetOnboarding();
        return this.onboardingService.getOnboardingResponse();
    }

    @ResolveField(() => Onboarding, {
        description: 'Force the onboarding modal open',
    })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.WELCOME,
    })
    async openOnboarding(): Promise<Onboarding> {
        await this.onboardingService.openOnboarding();
        return this.onboardingService.getOnboardingResponse();
    }

    @ResolveField(() => Onboarding, {
        description: 'Temporarily bypass onboarding in API memory',
    })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.WELCOME,
    })
    async bypassOnboarding(): Promise<Onboarding> {
        await this.onboardingService.bypassOnboarding();
        return this.onboardingService.getOnboardingResponse();
    }

    @ResolveField(() => Onboarding, {
        description: 'Clear the temporary onboarding bypass',
    })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.WELCOME,
    })
    async resumeOnboarding(): Promise<Onboarding> {
        await this.onboardingService.resumeOnboarding();
        return this.onboardingService.getOnboardingResponse();
    }

    @ResolveField(() => Onboarding, {
        description: 'Override onboarding state for testing (in-memory only)',
    })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.WELCOME,
    })
    async setOnboardingOverride(@Args('input') input: OnboardingOverrideInput): Promise<Onboarding> {
        const override: OnboardingOverrideState = {
            onboarding: input.onboarding,
            activationCode: input.activationCode,
            partnerInfo: input.partnerInfo,
            registrationState: input.registrationState,
        };
        this.onboardingOverrides.setState(override);
        this.onboardingService.clearActivationDataCache();
        return this.onboardingService.getOnboardingResponse();
    }

    @ResolveField(() => Onboarding, {
        description: 'Clear onboarding override state and reload from disk',
    })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.WELCOME,
    })
    async clearOnboardingOverride(): Promise<Onboarding> {
        this.onboardingOverrides.clearState();
        this.onboardingService.clearActivationDataCache();
        return this.onboardingService.getOnboardingResponse();
    }

    @ResolveField(() => Boolean, {
        description: 'Persist server-owned onboarding wizard draft state',
    })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.WELCOME,
    })
    async saveOnboardingDraft(@Args('input') input: SaveOnboardingDraftInput): Promise<boolean> {
        return this.onboardingService.saveOnboardingDraft(input);
    }

    @ResolveField(() => OnboardingInternalBootResult, {
        description: 'Create and configure internal boot pool via emcmd operations',
    })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.WELCOME,
    })
    async createInternalBootPool(
        @Args('input') input: CreateInternalBootPoolInput
    ): Promise<OnboardingInternalBootResult> {
        return this.onboardingInternalBootService.createInternalBootPool(input);
    }

    @ResolveField(() => OnboardingInternalBootContext, {
        description: 'Refresh onboarding internal boot context from the latest emhttp state',
    })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.WELCOME,
    })
    async refreshInternalBootContext(): Promise<OnboardingInternalBootContext> {
        return this.onboardingInternalBootService.refreshInternalBootContext();
    }
}
