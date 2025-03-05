import { Logger } from '@nestjs/common';
import { Args, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { GraphQLError } from 'graphql';
import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import type {
    DynamicRemoteAccessStatus,
    EnableDynamicRemoteAccessInput,
} from '@app/unraid-api/plugins/connect/api/graphql/generated/api/types.js';
import {
    ConnectResolvers,
    DynamicRemoteAccessType,
    Resource,
} from '@app/unraid-api/plugins/connect/api/graphql/generated/api/types.js';
import { RemoteAccessController } from '@app/remoteAccess/remote-access-controller.js';
import { store } from '@app/store/index.js';
import { setAllowedRemoteAccessUrl } from '@app/store/modules/dynamic-remote-access.js';

@Resolver('Connect')
export class ConnectResolver implements ConnectResolvers {
    protected logger = new Logger(ConnectResolver.name);

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
