import { getAllowedOrigins } from '@app/common/allowed-origins';
import {
    type ConnectSignInInput,
    type SetupRemoteAccessInput,
} from '@app/graphql/generated/api/types';
import type { Cloud } from '@app/graphql/generated/api/types';
import { connectSignIn } from '@app/graphql/resolvers/mutation/connect/connect-sign-in';
import { checkApi } from '@app/graphql/resolvers/query/cloud/check-api';
import { checkCloud } from '@app/graphql/resolvers/query/cloud/check-cloud';
import { checkMinigraphql } from '@app/graphql/resolvers/query/cloud/check-minigraphql';
import { setupRemoteAccessThunk } from '@app/store/actions/setup-remote-access';
import { store } from '@app/store/index';
import { logoutUser } from '@app/store/modules/config';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseRoles } from 'nest-access-control';

@Resolver('Cloud')
export class CloudResolver {
    @Query()
    @UseRoles({
        resource: 'cloud',
        action: 'read',
        possession: 'own',
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
                }${minigraphql.error ? `CLOUD: ${minigraphql.error}` : ''}` ||
                null,
        };
    }

    @Mutation()
    @UseRoles({
        resource: 'connect',
        action: 'update',
        possession: 'own',
    })
    public async connectSignIn(
        @Args('input') input: ConnectSignInInput
    ): Promise<boolean> {
        /**
         * @todo Move to service
         */
        return connectSignIn(input);
    }

    @Mutation()
    @UseRoles({
        resource: 'connect',
        action: 'update',
        possession: 'own',
    })
    public async connectSignOut() {
        await store.dispatch(
            logoutUser({ reason: 'Manual Sign Out Using API' })
        );
        return true;
    }

    @Mutation()
    @UseRoles({
        resource: 'connect',
        action: 'update',
        possession: 'own',
    })
    public async setupRemoteAccess(
        @Args('input') input: SetupRemoteAccessInput
    ): Promise<boolean> {
        await store.dispatch(setupRemoteAccessThunk(input));
        return true;
    }
}
