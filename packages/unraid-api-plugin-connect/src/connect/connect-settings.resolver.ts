import { Logger } from '@nestjs/common';
import { Args, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { type Layout } from '@jsonforms/core';
import { GraphQLJSON } from 'graphql-scalars';
import { AuthActionVerb, AuthPossession } from 'nest-authz';

import { Resource } from '@unraid/shared/graphql.model.js';
import { PrefixedID } from '@unraid/shared/prefixed-id-scalar.js';
import { DataSlice } from '@unraid/shared/jsonforms/settings.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { ConnectSettingsService } from './connect-settings.service.js';
import { EVENTS } from '../pubsub/consts.js';
import {
    AllowedOriginInput,
    ApiSettingsInput,
    ConnectSettings,
    ConnectSettingsValues,
    ConnectSignInInput,
    EnableDynamicRemoteAccessInput,
    RemoteAccess,
    SetupRemoteAccessInput,
} from './connect.model.js';

@Resolver(() => ConnectSettings)
export class ConnectSettingsResolver {
    private readonly logger = new Logger(ConnectSettingsResolver.name);
    
    constructor(
        private readonly connectSettingsService: ConnectSettingsService,
        private readonly eventEmitter: EventEmitter2
    ) {}

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

    @ResolveField(() => GraphQLJSON)
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
        this.eventEmitter.emit(EVENTS.LOGOUT, { reason: 'Manual Sign Out Using API' });
        return true;
    }

    @Mutation(() => Boolean)
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.CONNECT,
        possession: AuthPossession.ANY,
    })
    public async setupRemoteAccess(@Args('input') input: SetupRemoteAccessInput): Promise<boolean> {
        await this.connectSettingsService.syncSettings({
            accessType: input.accessType,
            forwardType: input.forwardType,
            port: input.port,
        });
        return true;
    }

    @Mutation(() => [String])
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.CONFIG,
        possession: AuthPossession.ANY,
    })
    public async setAdditionalAllowedOrigins(@Args('input') input: AllowedOriginInput) {
        await this.connectSettingsService.syncSettings({
            extraOrigins: input.origins,
        });
        return this.connectSettingsService.extraAllowedOrigins();
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
        await this.connectSettingsService.enableDynamicRemoteAccess(dynamicRemoteAccessInput);
        return true;
    }
} 