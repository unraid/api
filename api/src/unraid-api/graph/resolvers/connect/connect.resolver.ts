import { Logger } from '@nestjs/common';
import { Query, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import { store } from '@app/store/index.js';
import { Resource } from '@app/unraid-api/graph/resolvers/base.model.js';
import {
    Connect,
    ConnectSettings,
    DynamicRemoteAccessStatus,
    DynamicRemoteAccessType,
} from '@app/unraid-api/graph/resolvers/connect/connect.model.js';

@Resolver(() => Connect)
export class ConnectResolver {
    protected logger = new Logger(ConnectResolver.name);
    constructor() {}

    @Query(() => Connect)
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.CONNECT,
        possession: AuthPossession.ANY,
    })
    public connect(): Connect {
        return {
            id: 'connect',
        };
    }

    @ResolveField(() => String)
    public id() {
        return 'connect';
    }

    @ResolveField(() => DynamicRemoteAccessStatus)
    public dynamicRemoteAccess(): DynamicRemoteAccessStatus {
        const state = store.getState();
        return {
            runningType: state.dynamicRemoteAccess.runningType,
            enabledType: state.config.remote.dynamicRemoteAccessType ?? DynamicRemoteAccessType.DISABLED,
            error: state.dynamicRemoteAccess.error ?? undefined,
        };
    }

    @ResolveField(() => ConnectSettings)
    public async settings(): Promise<ConnectSettings> {
        return {} as ConnectSettings;
    }
}
