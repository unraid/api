import { Query, Resolver } from '@nestjs/graphql';

import { Resource } from '@unraid/shared/graphql.model.js';

import { getAllowedOrigins } from '@app/common/allowed-origins.js';
import { checkApi } from '@app/graphql/resolvers/query/cloud/check-api.js';
import { checkCloud } from '@app/graphql/resolvers/query/cloud/check-cloud.js';
import { checkMinigraphql } from '@app/graphql/resolvers/query/cloud/check-minigraphql.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@app/unraid-api/graph/directives/use-permissions.directive.js';
import { Cloud } from '@app/unraid-api/graph/resolvers/cloud/cloud.model.js';

@Resolver(() => Cloud)
export class CloudResolver {
    @Query(() => Cloud)
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
                timeout: undefined,
            },
            apiKey,
            minigraphql,
            cloud,
            allowedOrigins: getAllowedOrigins(),
            error:
                `${apiKey.error ? `API KEY: ${apiKey.error}` : ''}${
                    cloud.error ? `NETWORK: ${cloud.error}` : ''
                }${minigraphql.error ? `CLOUD: ${minigraphql.error}` : ''}` || undefined,
        };
    }
}
