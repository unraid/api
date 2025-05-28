import { Query, Resolver } from '@nestjs/graphql';

import { bootTimestamp } from '@app/common/dashboard/boot-timestamp.js';
import { API_VERSION } from '@app/environment.js';
import { store } from '@app/store/index.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@app/unraid-api/graph/directives/use-permissions.directive.js';
import { Resource } from '@unraid/shared/graphql.model.js';
import { DynamicRemoteAccessType } from '@app/unraid-api/graph/resolvers/connect/connect.model.js';
import { Service } from '@app/unraid-api/graph/services/service.model.js';

@Resolver(() => Service)
export class ServicesResolver {
    constructor() {}

    private getDynamicRemoteAccessService = (): Service | null => {
        const { config, dynamicRemoteAccess } = store.getState();
        const enabledStatus = config.remote.dynamicRemoteAccessType;

        return {
            id: 'service/dynamic-remote-access',
            name: 'dynamic-remote-access',
            online: enabledStatus !== DynamicRemoteAccessType.DISABLED,
            version: dynamicRemoteAccess.runningType,
            uptime: {
                timestamp: bootTimestamp.toISOString(),
            },
        };
    };

    private getApiService = (): Service => {
        return {
            id: 'service/unraid-api',
            name: 'unraid-api',
            online: true,
            uptime: {
                timestamp: bootTimestamp.toISOString(),
            },
            version: API_VERSION,
        };
    };

    @Query(() => [Service])
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.SERVICES,
        possession: AuthPossession.ANY,
    })
    public services(): Service[] {
        const dynamicRemoteAccess = this.getDynamicRemoteAccessService();
        return [this.getApiService(), ...(dynamicRemoteAccess ? [dynamicRemoteAccess] : [])];
    }
}
