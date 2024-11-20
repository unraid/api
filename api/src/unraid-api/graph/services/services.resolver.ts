import { Query, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import { bootTimestamp } from '@app/common/dashboard/boot-timestamp';
import { API_VERSION } from '@app/environment';
import { DynamicRemoteAccessType, Resource, Service } from '@app/graphql/generated/api/types';
import { store } from '@app/store/index';

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
        possession: AuthPossession.OWN,
    })
    public services(): Service[] {
        const dynamicRemoteAccess = this.getDynamicRemoteAccessService();
        return [this.getApiService(), ...(dynamicRemoteAccess ? [dynamicRemoteAccess] : [])];
    }
}
