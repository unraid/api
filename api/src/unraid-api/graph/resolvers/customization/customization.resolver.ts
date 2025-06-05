import { Query, ResolveField, Resolver } from '@nestjs/graphql';

import { Resource } from '@unraid/shared/graphql.model.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@unraid/shared/use-permissions.directive.js';

import { Public } from '@app/unraid-api/auth/public.decorator.js'; // Import Public decorator

import {
    ActivationCode,
    Customization,
    PublicPartnerInfo,
} from '@app/unraid-api/graph/resolvers/customization/activation-code.model.js';
import { CustomizationService } from '@app/unraid-api/graph/resolvers/customization/customization.service.js';
import { Theme } from '@app/unraid-api/graph/resolvers/customization/theme.model.js';

@Resolver(() => Customization)
export class CustomizationResolver {
    constructor(private readonly customizationService: CustomizationService) {}
    // Authenticated query
    @Query(() => Customization, { nullable: true })
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.CUSTOMIZATIONS,
        possession: AuthPossession.ANY,
    })
    async customization(): Promise<Customization | null> {
        // We return an empty object because the fields are resolved by @ResolveField
        return {};
    }

    // Dedicated public query - calls the internal helper
    @Query(() => PublicPartnerInfo, { nullable: true })
    @Public()
    async publicPartnerInfo(): Promise<PublicPartnerInfo | null> {
        return this.customizationService.getPublicPartnerInfo();
    }

    @Query(() => Theme)
    @Public()
    async publicTheme(): Promise<Theme> {
        return this.customizationService.getTheme();
    }

    @ResolveField(() => PublicPartnerInfo, { nullable: true, name: 'partnerInfo' })
    async resolvePartnerInfo(): Promise<PublicPartnerInfo | null> {
        return this.customizationService.getPublicPartnerInfo();
    }

    @ResolveField(() => ActivationCode, { nullable: true, name: 'activationCode' })
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.ACTIVATION_CODE,
        possession: AuthPossession.ANY,
    })
    async activationCode(): Promise<ActivationCode | null> {
        return this.customizationService.getActivationData();
    }

    @ResolveField(() => Theme)
    async theme(): Promise<Theme> {
        return this.customizationService.getTheme();
    }
}
