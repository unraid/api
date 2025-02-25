import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import type {
    Cloud,
    ConnectSignInInput,
    RemoteAccess,
    SetupRemoteAccessInput,
} from '@app/graphql/generated/api/types.js';
import { getAllowedOrigins, getExtraOrigins } from '@app/common/allowed-origins.js';
import {
    DynamicRemoteAccessType,
    Resource,
    WAN_ACCESS_TYPE,
    WAN_FORWARD_TYPE,
} from '@app/graphql/generated/api/types.js';
import { connectSignIn } from '@app/graphql/resolvers/mutation/connect/connect-sign-in.js';
import { checkApi } from '@app/graphql/resolvers/query/cloud/check-api.js';
import { checkCloud } from '@app/graphql/resolvers/query/cloud/check-cloud.js';
import { checkMinigraphql } from '@app/graphql/resolvers/query/cloud/check-minigraphql.js';
import { setupRemoteAccessThunk } from '@app/store/actions/setup-remote-access.js';
import { getters, store } from '@app/store/index.js';
import { logoutUser } from '@app/store/modules/config.js';

@Resolver('Cloud')
export class CloudResolver {
    @Query()
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.CLOUD,
        possession: AuthPossession.ANY,
    })
    public async cloud(): Promise<Cloud> {
        const minigraphql = checkMinigraphql();
        const [apiKey, cloud] = await Promise.all([checkApi(), checkCloud()]);

        return {
            relay: {
                // Left in for UPC backwards compat.
                error: undefined,
                status: 'connected',
                timeout: null,
            },
            apiKey,
            minigraphql,
            cloud,
            allowedOrigins: getAllowedOrigins(),
            error:
                `${apiKey.error ? `API KEY: ${apiKey.error}` : ''}${
                    cloud.error ? `NETWORK: ${cloud.error}` : ''
                }${minigraphql.error ? `CLOUD: ${minigraphql.error}` : ''}` || null,
        };
    }

    @Query()
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.CONNECT,
        possession: AuthPossession.ANY,
    })
    public async remoteAccess(): Promise<RemoteAccess> {
        const hasWanAccess = getters.config().remote.wanaccess === 'yes';
        const dynamicRemoteAccessSettings: RemoteAccess = {
            accessType: hasWanAccess
                ? getters.config().remote.dynamicRemoteAccessType !== DynamicRemoteAccessType.DISABLED
                    ? WAN_ACCESS_TYPE.DYNAMIC
                    : WAN_ACCESS_TYPE.ALWAYS
                : WAN_ACCESS_TYPE.DISABLED,
            forwardType: getters.config().remote.upnpEnabled
                ? WAN_FORWARD_TYPE.UPNP
                : WAN_FORWARD_TYPE.STATIC,
            port: getters.config().remote.wanport ? Number(getters.config().remote.wanport) : null,
        };

        return dynamicRemoteAccessSettings;
    }

    @Query()
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.CONNECT,
        possession: AuthPossession.ANY,
    })
    public async extraAllowedOrigins(): Promise<Array<string>> {
        const extraOrigins = getExtraOrigins();

        return extraOrigins;
    }

    @Mutation()
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.CONNECT,
        possession: AuthPossession.ANY,
    })
    public async connectSignIn(@Args('input') input: ConnectSignInInput): Promise<boolean> {
        /**
         * @todo Move to service
         */
        return await connectSignIn(input);
    }

    @Mutation()
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.CONNECT,
        possession: AuthPossession.ANY,
    })
    public async connectSignOut() {
        await store.dispatch(logoutUser({ reason: 'Manual Sign Out Using API' }));
        return true;
    }

    @Mutation()
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.CONNECT,
        possession: AuthPossession.ANY,
    })
    public async setupRemoteAccess(@Args('input') input: SetupRemoteAccessInput): Promise<boolean> {
        await store.dispatch(setupRemoteAccessThunk(input)).unwrap();
        return true;
    }
}
