import { Logger } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@unraid/shared/use-permissions.directive.js';

import { Public } from '@app/unraid-api/auth/public.decorator.js';
import { OidcConfigPersistence } from '@app/unraid-api/graph/resolvers/sso/oidc-config.service.js';
import {
    OidcProvider,
    OidcProviderInput,
} from '@app/unraid-api/graph/resolvers/sso/oidc-provider.model.js';
import { OidcSessionValidation } from '@app/unraid-api/graph/resolvers/sso/oidc-session-validation.model.js';
import { OidcSessionService } from '@app/unraid-api/graph/resolvers/sso/oidc-session.service.js';
import { PublicOidcProvider } from '@app/unraid-api/graph/resolvers/sso/public-oidc-provider.model.js';

@Resolver()
export class SsoResolver {
    private readonly logger = new Logger(SsoResolver.name);

    constructor(
        private readonly oidcConfig: OidcConfigPersistence,
        private readonly oidcSessionService: OidcSessionService
    ) {}

    @Query(() => [PublicOidcProvider], {
        description: 'Get public OIDC provider information for login buttons',
    })
    @Public()
    public async publicOidcProviders(): Promise<PublicOidcProvider[]> {
        const providers = await this.oidcConfig.getProviders();
        return providers.map((provider) => ({
            id: provider.id,
            name: provider.name,
            buttonText: provider.buttonText,
            buttonIcon: provider.buttonIcon,
            buttonVariant: provider.buttonVariant,
            buttonStyle: provider.buttonStyle,
        }));
    }

    @Query(() => [OidcProvider], { description: 'Get all configured OIDC providers (admin only)' })
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: 'sso',
        possession: AuthPossession.ANY,
    })
    public async oidcProviders(): Promise<OidcProvider[]> {
        return this.oidcConfig.getProviders();
    }

    @Query(() => OidcProvider, { nullable: true, description: 'Get a specific OIDC provider by ID' })
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: 'sso',
        possession: AuthPossession.ANY,
    })
    public async oidcProvider(@Args('id') id: string): Promise<OidcProvider | null> {
        return this.oidcConfig.getProvider(id);
    }

    @Mutation(() => OidcProvider, { description: 'Create or update an OIDC provider' })
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: 'sso',
        possession: AuthPossession.ANY,
    })
    public async upsertOidcProvider(
        @Args('provider') provider: OidcProviderInput
    ): Promise<OidcProvider> {
        const result = await this.oidcConfig.upsertProvider(provider as OidcProvider);
        this.logger.log(`Upserted OIDC provider: ${provider.id}`);
        return result;
    }

    @Mutation(() => Boolean, { description: 'Delete an OIDC provider' })
    @UsePermissions({
        action: AuthActionVerb.DELETE,
        resource: 'sso',
        possession: AuthPossession.ANY,
    })
    public async deleteOidcProvider(@Args('id') id: string): Promise<boolean> {
        const result = await this.oidcConfig.deleteProvider(id);
        if (result) {
            this.logger.log(`Deleted OIDC provider: ${id}`);
        }
        return result;
    }

    @Query(() => OidcSessionValidation, {
        description: 'Validate an OIDC session token (internal use for CLI validation)',
    })
    public async validateOidcSession(@Args('token') token: string): Promise<OidcSessionValidation> {
        return await this.oidcSessionService.validateSession(token);
    }
}
