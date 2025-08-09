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

        // Filter out providers without valid authorization rules
        const providersWithRules = providers.filter((provider) => {
            // Check if provider has authorization rules
            if (!provider.authorizationRules || provider.authorizationRules.length === 0) {
                this.logger.debug(
                    `Hiding provider ${provider.id} from login page - no authorization rules configured`
                );
                return false;
            }

            // Check if at least one rule is complete and valid
            const hasValidRules = provider.authorizationRules.some(
                (rule) =>
                    rule.claim && // Has a claim specified
                    rule.operator && // Has an operator specified
                    rule.value && // Has values array
                    rule.value.length > 0 && // Has at least one value
                    rule.value.some((v) => v && v.trim() !== '') // At least one non-empty value
            );

            if (!hasValidRules) {
                this.logger.debug(
                    `Hiding provider ${provider.id} from login page - no valid rule values`
                );
                return false;
            }

            return true;
        });

        return providersWithRules.map((provider) => ({
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
        // Special handling for unraid.net provider - only allow updating authorization rules
        if (provider.id === 'unraid.net') {
            const existingProvider = await this.oidcConfig.getProvider('unraid.net');
            if (!existingProvider) {
                throw new Error('Unraid.net provider not found');
            }

            // Only allow updating authorization rules and button customization for unraid.net
            const restrictedUpdate: OidcProvider = {
                ...existingProvider,
                authorizationRules: provider.authorizationRules || existingProvider.authorizationRules,
                buttonText: provider.buttonText || existingProvider.buttonText,
                buttonIcon: provider.buttonIcon || existingProvider.buttonIcon,
                buttonVariant: provider.buttonVariant || existingProvider.buttonVariant,
                buttonStyle: provider.buttonStyle || existingProvider.buttonStyle,
            };

            const result = await this.oidcConfig.upsertProvider(restrictedUpdate);
            this.logger.log(`Updated Unraid.net provider authorization rules`);
            return result;
        }

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
        // Prevent deletion of the unraid.net provider
        if (id === 'unraid.net') {
            throw new Error('Cannot delete the Unraid.net provider');
        }

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
