import { Args, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { ApiConfig } from '@unraid/shared/services/api-config.js';
import { UserSettingsService } from '@unraid/shared/services/user-settings.js';
import { GraphQLJSON } from 'graphql-scalars';

import { LifecycleService } from '@app/unraid-api/app/lifecycle.service.js';
import {
    Settings,
    UnifiedSettings,
    UpdateSettingsResponse,
} from '@app/unraid-api/graph/resolvers/settings/settings.model.js';
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
    constructor(
        private readonly userSettings: UserSettingsService,
        private readonly lifecycleService: LifecycleService
    ) {}

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

    @Mutation(() => UpdateSettingsResponse)
    async updateSettings(
        @Args('input', { type: () => GraphQLJSON }) input: object
    ): Promise<UpdateSettingsResponse> {
        const { restartRequired, values } = await this.userSettings.updateNamespacedValues(input);
        if (restartRequired) {
            // hack: allow time for pending writes to flush
            this.lifecycleService.restartApi({ delayMs: 300 });
        }
        return { restartRequired, values };
    }
}
