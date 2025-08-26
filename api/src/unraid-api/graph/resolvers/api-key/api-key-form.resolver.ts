import { Injectable } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

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
        action: AuthAction.READ_ANY,
        resource: Resource.API_KEY,
    })
    getApiKeyCreationFormSchema(): ApiKeyFormSettings {
        return this.apiKeyFormService.getApiKeyCreationFormSchema();
    }
}
