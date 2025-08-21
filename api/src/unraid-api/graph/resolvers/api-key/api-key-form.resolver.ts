import { Injectable } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';

import { Resource } from '@unraid/shared/graphql.model.js';
import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import { ApiKeyFormService } from '@app/unraid-api/graph/resolvers/api-key/api-key-form.service.js';
import { ApiKeyFormSettings } from '@app/unraid-api/graph/resolvers/settings/settings.model.js';

@Injectable()
@Resolver()
export class ApiKeyFormResolver {
    constructor(private apiKeyFormService: ApiKeyFormService) {}

    @Query(() => ApiKeyFormSettings, {
        description: 'Get JSON Schema for API key creation form',
    })
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.API_KEY,
        possession: AuthPossession.ANY,
    })
    getApiKeyCreationFormSchema(): ApiKeyFormSettings {
        return this.apiKeyFormService.getApiKeyCreationFormSchema();
    }

    @Query(() => ApiKeyFormSettings, {
        description: 'Get JSON Schema for API key authorization form',
    })
    getApiKeyAuthorizationFormSchema(
        @Args('appName') appName: string,
        @Args('requestedScopes', { type: () => [String] }) requestedScopes: string[],
        @Args('appDescription', { nullable: true }) appDescription?: string
    ): ApiKeyFormSettings {
        return this.apiKeyFormService.getApiKeyAuthorizationFormSchema(
            appName,
            requestedScopes,
            appDescription
        );
    }
}
