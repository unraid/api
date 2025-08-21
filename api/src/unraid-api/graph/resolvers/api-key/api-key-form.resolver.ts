import { Injectable } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';

import { Resource } from '@unraid/shared/graphql.model.js';
import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import { ApiKeyFormSchema } from '@app/unraid-api/graph/resolvers/api-key/api-key-form.model.js';
import { ApiKeyFormService } from '@app/unraid-api/graph/resolvers/api-key/api-key-form.service.js';

@Injectable()
@Resolver()
export class ApiKeyFormResolver {
    constructor(private apiKeyFormService: ApiKeyFormService) {}

    @Query(() => ApiKeyFormSchema, {
        description: 'Get JSON Schema for API key creation form',
    })
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.API_KEY,
        possession: AuthPossession.ANY,
    })
    getApiKeyCreationFormSchema(): ApiKeyFormSchema {
        return this.apiKeyFormService.getApiKeyCreationFormSchema();
    }

    @Query(() => ApiKeyFormSchema, {
        description: 'Get JSON Schema for API key authorization form',
    })
    getApiKeyAuthorizationFormSchema(
        @Args('appName') appName: string,
        @Args('requestedScopes', { type: () => [String] }) requestedScopes: string[],
        @Args('appDescription', { nullable: true }) appDescription?: string
    ): ApiKeyFormSchema {
        const result = this.apiKeyFormService.getApiKeyAuthorizationFormSchema(
            appName,
            requestedScopes,
            appDescription
        );
        return {
            schema: result.schema,
            uiSchema: result.uiSchema,
            formData: result.formData,
        };
    }
}
