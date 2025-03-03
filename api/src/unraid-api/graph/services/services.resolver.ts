import { Query, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import type { Service } from '@app/graphql/generated/api/types.js';
import { bootTimestamp } from '@app/common/dashboard/boot-timestamp.js';
import { API_VERSION } from '@app/environment.js';
import { DynamicRemoteAccessType, Resource } from '@app/graphql/generated/api/types.js';
import { store } from '@app/store/index.js';

@Resolver('Services')
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

    @Query('services')
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
