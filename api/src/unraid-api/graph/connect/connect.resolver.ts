import { store } from '@app/store/index';
import { Logger } from '@nestjs/common';
import { Args, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { UseRoles } from 'nest-access-control';
import { RemoteAccessController } from '@app/remoteAccess/remote-access-controller';
import { Connect, type DynamicRemoteAccessStatus, DynamicRemoteAccessType, type EnableDynamicRemoteAccessInput } from '@app/graphql/generated/api/types';
import {
    setAllowedRemoteAccessUrl,
    setRemoteAccessRunningType,
} from '@app/store/modules/dynamic-remote-access';
import { getServerIdentifier } from '@app/core/utils/server-identifier';

@Resolver('Connect')
export class ConnectResolver {
    protected logger = new Logger(ConnectResolver.name);
    @Query()
    @UseRoles({
        resource: 'connect/dynamic-remote-access',
        action: 'read',
        possession: 'own',
    })
    public connect() {
        return {
            id: getServerIdentifier('connect')
        }
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
    @UseRoles({
        resource: 'connect/dynamic-remote-access',
        action: 'update',
        possession: 'own',
    })
    public async enableDynamicRemoteAccess(
        @Args('input') dynamicRemoteAccessInput: EnableDynamicRemoteAccessInput
    ): Promise<boolean> {
        // Start or extend dynamic remote access
        const state = store.getState();

        const { dynamicRemoteAccessType } = state.config.remote;
        if (
            !dynamicRemoteAccessType ||
            dynamicRemoteAccessType === DynamicRemoteAccessType.DISABLED
        ) {
            throw new GraphQLError('Dynamic Remote Access is not enabled.', {
                extensions: { code: 'FORBIDDEN' },
            });
        }

        if (dynamicRemoteAccessInput.enabled === false) {
            store.dispatch(
                setRemoteAccessRunningType(DynamicRemoteAccessType.DISABLED)
            );
            return true;
        }

        const controller = RemoteAccessController.instance;
        if (
            controller.getRunningRemoteAccessType() ===
            DynamicRemoteAccessType.DISABLED
        ) {
            if (dynamicRemoteAccessInput.url) {
                store.dispatch(
                    setAllowedRemoteAccessUrl(dynamicRemoteAccessInput.url)
                );
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
