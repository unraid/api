import { Logger } from '@nestjs/common';
import { Args, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { Layout } from '@jsonforms/core';
import { GraphQLJSON, GraphQLJSONObject } from 'graphql-scalars';

import { getAllowedOrigins } from '@app/common/allowed-origins.js';
import { setupRemoteAccessThunk } from '@app/store/actions/setup-remote-access.js';
import { logoutUser, updateAllowedOrigins } from '@app/store/modules/config.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@app/unraid-api/graph/directives/use-permissions.directive.js';
import { Resource } from '@app/unraid-api/graph/resolvers/base.model.js';
import { ConnectSettingsService } from '@app/unraid-api/graph/resolvers/connect/connect-settings.service.js';
import {
    AllowedOriginInput,
    ApiSettingsInput,
    ConnectSettings,
    ConnectSettingsValues,
    ConnectSignInInput,
    EnableDynamicRemoteAccessInput,
    RemoteAccess,
    SetupRemoteAccessInput,
} from '@app/unraid-api/graph/resolvers/connect/connect.model.js';
import { PrefixedID } from '@app/unraid-api/graph/scalars/graphql-type-prefixed-id.js';
import { DataSlice } from '@app/unraid-api/types/json-forms.js';

@Resolver(() => ConnectSettings)
export class ConnectSettingsResolver {
    private readonly logger = new Logger(ConnectSettingsResolver.name);
    constructor(private readonly connectSettingsService: ConnectSettingsService) {}

    @ResolveField(() => PrefixedID)
    public async id(): Promise<string> {
        return 'connectSettingsForm';
    }

    @ResolveField(() => GraphQLJSON)
    public async dataSchema(): Promise<{ properties: DataSlice; type: 'object' }> {
        const { properties } = await this.connectSettingsService.buildSettingsSchema();
        return {
            type: 'object',
            properties,
        };
    }

    @ResolveField(() => GraphQLJSONObject)
    public async uiSchema(): Promise<Layout> {
        const { elements } = await this.connectSettingsService.buildSettingsSchema();
        return {
            type: 'VerticalLayout',
            elements,
        };
    }
    @ResolveField(() => ConnectSettingsValues)
    public async values(): Promise<ConnectSettingsValues> {
        return await this.connectSettingsService.getCurrentSettings();
    }

    @Query(() => RemoteAccess)
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.CONNECT,
        possession: AuthPossession.ANY,
    })
    public async remoteAccess(): Promise<RemoteAccess> {
        return this.connectSettingsService.dynamicRemoteAccessSettings();
    }

    @Query(() => [String])
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.CONNECT,
        possession: AuthPossession.ANY,
    })
    public async extraAllowedOrigins(): Promise<Array<string>> {
        return this.connectSettingsService.extraAllowedOrigins();
    }

    @Mutation(() => ConnectSettingsValues)
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.CONFIG,
        possession: AuthPossession.ANY,
    })
    public async updateApiSettings(@Args('input') settings: ApiSettingsInput) {
        this.logger.verbose(`Attempting to update API settings: ${JSON.stringify(settings, null, 2)}`);
        const restartRequired = await this.connectSettingsService.syncSettings(settings);
        const currentSettings = await this.connectSettingsService.getCurrentSettings();
        if (restartRequired) {
            setTimeout(async () => {
                // Send restart out of band to avoid blocking the return of this resolver
                this.logger.log('Restarting API');
                await this.connectSettingsService.restartApi();
            }, 300);
        }
        return currentSettings;
    }

    @Mutation(() => Boolean)
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.CONNECT,
        possession: AuthPossession.ANY,
    })
    public async connectSignIn(@Args('input') input: ConnectSignInInput): Promise<boolean> {
        return this.connectSettingsService.signIn(input);
    }

    @Mutation(() => Boolean)
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.CONNECT,
        possession: AuthPossession.ANY,
    })
    public async connectSignOut() {
        const { store } = await import('@app/store/index.js');
        await store.dispatch(logoutUser({ reason: 'Manual Sign Out Using API' }));
        return true;
    }

    @Mutation(() => Boolean)
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.CONNECT,
        possession: AuthPossession.ANY,
    })
    public async setupRemoteAccess(@Args('input') input: SetupRemoteAccessInput): Promise<boolean> {
        const { store } = await import('@app/store/index.js');
        await store.dispatch(setupRemoteAccessThunk(input)).unwrap();
        return true;
    }

    @Mutation(() => [String])
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.CONFIG,
        possession: AuthPossession.ANY,
    })
    public async setAdditionalAllowedOrigins(@Args('input') input: AllowedOriginInput) {
        const { store } = await import('@app/store/index.js');
        await store.dispatch(updateAllowedOrigins(input.origins));
        return getAllowedOrigins();
    }

    @Mutation(() => Boolean)
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.CONNECT__REMOTE_ACCESS,
        possession: AuthPossession.ANY,
    })
    public async enableDynamicRemoteAccess(
        @Args('input') dynamicRemoteAccessInput: EnableDynamicRemoteAccessInput
    ): Promise<boolean> {
        console.log('enableDynamicRemoteAccess', dynamicRemoteAccessInput);
        return this.connectSettingsService.enableDynamicRemoteAccess(dynamicRemoteAccessInput);
    }
}
