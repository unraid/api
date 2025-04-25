import { Query, ResolveField, Resolver } from '@nestjs/graphql';

import { fileExists } from '@app/core/utils/files/file-exists.js'; // Import utility

import { store } from '@app/store/index.js'; // Import store
import { Public } from '@app/unraid-api/auth/public.decorator.js'; // Import Public decorator

import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@app/unraid-api/graph/directives/use-permissions.directive.js';
import { Resource } from '@app/unraid-api/graph/resolvers/base.model.js';
import {
    ActivationCode,
    Customization,
    PublicPartnerInfo,
} from '@app/unraid-api/graph/resolvers/customization/activation-code.model.js';
import { CustomizationService } from '@app/unraid-api/graph/resolvers/customization/customization.service.js';

@Resolver(() => Customization)
export class CustomizationResolver {
    constructor(private readonly customizationService: CustomizationService) {}

    private async _getPublicPartnerInfoInternal(): Promise<PublicPartnerInfo | null> {
        const hasPartnerLogo = (await this.customizationService.getPartnerLogoWebguiPath()) !== null;
        const activationData = await this.customizationService.getActivationData();

        return {
            hasPartnerLogo: hasPartnerLogo,
            partnerName: activationData?.partnerName,
            partnerUrl: activationData?.partnerUrl,
            partnerLogoUrl: (await this.customizationService.getPartnerLogoWebguiPath()) ?? undefined,
        };
    }

    private async isPasswordSet(): Promise<boolean> {
        const paths = store.getState().paths;
        const hasPasswd = await fileExists(paths.passwd);
        return hasPasswd;
    }

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
        if (!(await this.isPasswordSet())) {
            return this._getPublicPartnerInfoInternal();
        }
        return null;
    }

    @ResolveField(() => PublicPartnerInfo, { nullable: true, name: 'partnerInfo' })
    async resolvePartnerInfo(): Promise<PublicPartnerInfo | null> {
        return this._getPublicPartnerInfoInternal();
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
}
