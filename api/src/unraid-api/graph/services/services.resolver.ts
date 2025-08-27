import { ConfigService } from '@nestjs/config';
import { Query, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { bootTimestamp } from '@app/common/dashboard/boot-timestamp.js';
import { API_VERSION } from '@app/environment.js';
import { Service } from '@app/unraid-api/graph/services/service.model.js';

@Resolver(() => Service)
export class ServicesResolver {
    constructor(private readonly configService: ConfigService) {}

    private getDynamicRemoteAccessService = (): Service | null => {
        const connectConfig = this.configService.get('connect');
        if (!connectConfig) {
            return null;
        }
        const enabledStatus = connectConfig.config.dynamicRemoteAccessType;

        return {
            id: 'service/dynamic-remote-access',
            name: 'dynamic-remote-access',
            online: enabledStatus && enabledStatus !== 'DISABLED',
            version: connectConfig.dynamicRemoteAccess?.runningType,
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
        action: AuthAction.READ_ANY,
        resource: Resource.SERVICES,
    })
    public services(): Service[] {
        const dynamicRemoteAccess = this.getDynamicRemoteAccessService();
        return [this.getApiService(), ...(dynamicRemoteAccess ? [dynamicRemoteAccess] : [])];
    }
}
