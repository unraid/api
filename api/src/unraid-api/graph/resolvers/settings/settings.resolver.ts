import { Query, ResolveField, Resolver } from '@nestjs/graphql';

import { ApiConfig } from '@unraid/shared/services/api-config.js';
import { UserSettingsService } from '@unraid/shared/services/user-settings.js';
import { GraphQLJSON } from 'graphql-scalars';

import { Settings, UnifiedSettings } from '@app/unraid-api/graph/resolvers/settings/settings.model.js';
import { ApiSettings } from '@app/unraid-api/graph/resolvers/settings/settings.service.js';

@Resolver(() => Settings)
export class SettingsResolver {
    constructor(private readonly apiSettings: ApiSettings) {}

    @Query(() => Settings)
    async settings() {
        return {
            id: 'settings',
        };
    }

    @ResolveField(() => ApiConfig, { description: 'The API setting values' })
    async api() {
        return {
            id: 'api-settings',
            ...this.apiSettings.getSettings(),
        };
    }

    @ResolveField(() => UnifiedSettings)
    async unified() {
        return {
            id: 'unified-settings',
        };
    }
}

@Resolver(() => UnifiedSettings)
export class UnifiedSettingsResolver {
    constructor(private readonly userSettings: UserSettingsService) {}

    @ResolveField(() => GraphQLJSON)
    async dataSchema() {
        const { properties } = await this.userSettings.getAllSettings(['api']);
        return {
            type: 'object',
            properties,
        };
    }

    @ResolveField(() => GraphQLJSON)
    async uiSchema() {
        const { elements } = await this.userSettings.getAllSettings(['api']);
        return {
            type: 'VerticalLayout',
            elements,
        };
    }

    @ResolveField(() => GraphQLJSON)
    async values() {
        return this.userSettings.getAllValues();
    }
}
