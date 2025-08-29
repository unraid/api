import { Logger } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { PrefixedID } from '@unraid/shared/prefixed-id-scalar.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { Public } from '@app/unraid-api/auth/public.decorator.js';
import { OidcConfigPersistence } from '@app/unraid-api/graph/resolvers/sso/oidc-config.service.js';
import { OidcConfiguration } from '@app/unraid-api/graph/resolvers/sso/oidc-configuration.model.js';
import { OidcProvider } from '@app/unraid-api/graph/resolvers/sso/oidc-provider.model.js';
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
        action: AuthAction.READ_ANY,
        resource: Resource.CONFIG,
    })
    public async oidcProviders(): Promise<OidcProvider[]> {
        return this.oidcConfig.getProviders();
    }

    @Query(() => OidcProvider, { nullable: true, description: 'Get a specific OIDC provider by ID' })
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.CONFIG,
    })
    public async oidcProvider(
        @Args('id', { type: () => PrefixedID }) id: string
    ): Promise<OidcProvider | null> {
        return this.oidcConfig.getProvider(id);
    }

    @Query(() => OidcConfiguration, { description: 'Get the full OIDC configuration (admin only)' })
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.CONFIG,
    })
    public async oidcConfiguration(): Promise<OidcConfiguration> {
        const config = await this.oidcConfig.getConfig();
        return {
            providers: config?.providers || [],
            defaultAllowedOrigins: config?.defaultAllowedOrigins || [],
        };
    }

    @Query(() => OidcSessionValidation, {
        description: 'Validate an OIDC session token (internal use for CLI validation)',
    })
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.CONFIG,
    })
    public async validateOidcSession(@Args('token') token: string): Promise<OidcSessionValidation> {
        return await this.oidcSessionService.validateSession(token);
    }
}
