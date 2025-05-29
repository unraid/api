import { Query, Resolver } from '@nestjs/graphql';
import { ConfigService } from '@nestjs/config';

import { bootTimestamp } from '@app/common/dashboard/boot-timestamp.js';
import { API_VERSION } from '@app/environment.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@app/unraid-api/graph/directives/use-permissions.directive.js';
import { Resource } from '@unraid/shared/graphql.model.js';
import { Service } from '@app/unraid-api/graph/services/service.model.js';

@Resolver(() => Service)
export class ServicesResolver {
    constructor(
        private readonly configService: ConfigService
    ) {}

    private getDynamicRemoteAccessService = (): Service | null => {
        const connectConfig = this.configService.get('connect');
        if (!connectConfig) {
            return null;
        }
        const enabledStatus = connectConfig.config.dynamicRemoteAccessType;

        return {
            id: 'service/dynamic-remote-access',
            name: 'dynamic-remote-access',
            online: enabledStatus && enabledStatus !== "DISABLED",
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
        action: AuthActionVerb.READ,
        resource: Resource.SERVICES,
        possession: AuthPossession.ANY,
    })
    public services(): Service[] {
        const dynamicRemoteAccess = this.getDynamicRemoteAccessService();
        return [this.getApiService(), ...(dynamicRemoteAccess ? [dynamicRemoteAccess] : [])];
    }
}
