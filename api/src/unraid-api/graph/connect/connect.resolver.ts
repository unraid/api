import { Logger } from '@nestjs/common';
import { Args, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { GraphQLError } from 'graphql';
import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import type {
    ConnectResolvers,
    ConnectSettings,
    DynamicRemoteAccessStatus,
    EnableDynamicRemoteAccessInput,
} from '@app/graphql/generated/api/types.js';
import { DynamicRemoteAccessType, Resource } from '@app/graphql/generated/api/types.js';
import { RemoteAccessController } from '@app/remoteAccess/remote-access-controller.js';
import { store } from '@app/store/index.js';
import { setAllowedRemoteAccessUrl } from '@app/store/modules/dynamic-remote-access.js';
import { ConnectSettingsService } from '@app/unraid-api/graph/connect/connect-settings.service.js';

@Resolver('Connect')
export class ConnectResolver implements ConnectResolvers {
    protected logger = new Logger(ConnectResolver.name);
    constructor(private readonly connectSettingsService: ConnectSettingsService) {}

    @Query('connect')
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.CONNECT,
        possession: AuthPossession.ANY,
    })
    public connect() {
        return {};
    }

    @ResolveField()
    public id() {
        return 'connect';
    }

    @ResolveField()
    public async settings(): Promise<ConnectSettings> {
        const { properties, elements } = await this.connectSettingsService.buildSettingsSchema();
        return {
            id: 'connectSettingsForm',
            dataSchema: {
                type: 'object',
                properties,
            },
            uiSchema: {
                type: 'VerticalLayout',
                elements,
            },
            values: await this.connectSettingsService.getCurrentSettings(),
        };
    }

    @ResolveField()
    public dynamicRemoteAccess(): DynamicRemoteAccessStatus {
        return {
            runningType: store.getState().dynamicRemoteAccess.runningType,
            enabledType:
                store.getState().config.remote.dynamicRemoteAccessType ??
                DynamicRemoteAccessType.DISABLED,
            error: store.getState().dynamicRemoteAccess.error,
        };
    }

    @Mutation()
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.CONNECT__REMOTE_ACCESS,
        possession: AuthPossession.ANY,
    })
    public async enableDynamicRemoteAccess(
        @Args('input') dynamicRemoteAccessInput: EnableDynamicRemoteAccessInput
    ): Promise<boolean> {
        // Start or extend dynamic remote access
        const state = store.getState();

        const { dynamicRemoteAccessType } = state.config.remote;
        if (!dynamicRemoteAccessType || dynamicRemoteAccessType === DynamicRemoteAccessType.DISABLED) {
            throw new GraphQLError('Dynamic Remote Access is not enabled.', {
                extensions: { code: 'FORBIDDEN' },
            });
        }

        const controller = RemoteAccessController.instance;

        if (dynamicRemoteAccessInput.enabled === false) {
            controller.stopRemoteAccess({
                getState: store.getState,
                dispatch: store.dispatch,
            });
            return true;
        } else if (controller.getRunningRemoteAccessType() === DynamicRemoteAccessType.DISABLED) {
            if (dynamicRemoteAccessInput.url) {
                store.dispatch(setAllowedRemoteAccessUrl(dynamicRemoteAccessInput.url));
            }
            controller.beginRemoteAccess({
                getState: store.getState,
                dispatch: store.dispatch,
            });
        } else {
            controller.extendRemoteAccess({
                getState: store.getState,
                dispatch: store.dispatch,
            });
        }

        return true;
    }
}
