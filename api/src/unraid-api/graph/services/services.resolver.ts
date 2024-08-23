import { bootTimestamp } from '@app/common/dashboard/boot-timestamp';
import { API_VERSION } from '@app/environment';
import { DynamicRemoteAccessType, Service } from '@app/graphql/generated/api/types';
import { store } from '@app/store/index';
import { Query, Resolver } from '@nestjs/graphql';
import { UseRoles } from 'nest-access-control';

@Resolver('Services')
export class ServicesResolver {
    constructor() {}

    private getDynamicRemoteAccessService = (): Service | null => {
        const { config, dynamicRemoteAccess } = store.getState();
        const enabledStatus = config.remote.dynamicRemoteAccessType;

        return {
            name: 'dynamic-remote-access',
            online: enabledStatus !== DynamicRemoteAccessType.DISABLED,
            version: dynamicRemoteAccess.runningType,
            uptime: {
                timestamp: bootTimestamp.toISOString(),
            },
        };
    };

    @Query('services')
    @UseRoles({
        resource: 'services',
        action: 'read',
        possession: 'own',
    })
    public services(): Service[] {
        const dynamicRemoteAccess = this.getDynamicRemoteAccessService();
        return [
            {
                name: 'unraid-api',
                online: true,
                uptime: {
                    timestamp: bootTimestamp.toISOString(),
                },
                version: API_VERSION,
            },
            ...(dynamicRemoteAccess ? [dynamicRemoteAccess] : []),
        ];
    }
}
