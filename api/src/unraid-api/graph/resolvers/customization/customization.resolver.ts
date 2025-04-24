import { Field, ObjectType, Query, Resolver } from '@nestjs/graphql';

import { GraphQLError } from 'graphql';

// No direct import of fs/promises needed if only using fileExists

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
    Customization,
    PublicPartnerInfoDto,
} from '@app/unraid-api/graph/resolvers/customization/activation-code.dto.js';
import { CustomizationService } from '@app/unraid-api/graph/resolvers/customization/customization.service.js';

// Define a new DTO for the partner info

@Resolver(() => Customization)
export class CustomizationResolver {
    constructor(private readonly customizationService: CustomizationService) {}

    @Query(() => Customization, { nullable: true })
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.ACTIVATION_CODE,
        possession: AuthPossession.ANY,
    })
    async getActivationData(): Promise<Customization | null> {
        // The service already caches the data after onModuleInit or fetches it on demand
        return {
            activationCode: (await this.customizationService.getActivationData()) ?? undefined,
            caseIcon: (await this.customizationService.getCaseIconWebguiPath()) ?? undefined,
            partnerLogo: (await this.customizationService.getPartnerLogoWebguiPath()) ?? undefined,
        };
    }

    // Add the new query
    @Query(() => PublicPartnerInfoDto, { nullable: true, name: 'partnerInfo' })
    @Public()
    async getPartnerInfo(): Promise<PublicPartnerInfoDto | null> {
        const paths = store.getState().paths; // Get paths from store state
        const hasPasswd = await fileExists(paths.passwd); // Use fileExists utility

        // Only return partner info if the passwd file *does not* exist
        if (hasPasswd) {
            return null;
        }

        const activationData = await this.customizationService.getActivationData();
        const hasPartnerLogo = await this.customizationService.getPartnerLogoWebguiPath(); // Returns boolean

        if (!activationData) {
            // If no activation data, we can still potentially return logo status if it exists independently
            // but partnerName requires activationData. Return null if no activation data.
            return null;
        }

        // Return only the requested fields (partnerLogo is now boolean)
        return {
            hasPartnerLogo: hasPartnerLogo !== null,
            partnerName: activationData.partnerName,
        };
    }
}
