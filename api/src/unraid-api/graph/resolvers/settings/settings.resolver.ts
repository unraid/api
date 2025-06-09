import { Injectable } from '@nestjs/common';
import { ResolveField, Resolver } from '@nestjs/graphql';

import { UserSettingsService } from '@unraid/shared/services/user-settings.js';
import { GraphQLJSON } from 'graphql-scalars';

import { UnifiedSettings } from '@app/unraid-api/graph/resolvers/settings/settings.model.js';

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
