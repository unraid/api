import { Query, Resolver } from '@nestjs/graphql';

import { Resource } from '@unraid/shared/graphql.model.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@unraid/shared/use-permissions.directive.js';

import { Cloud } from '../model/cloud.model.js';
import { CloudService } from '../service/cloud.service.js';
import { NetworkService } from '../service/network.service.js';

@Resolver(() => Cloud)
export class CloudResolver {
    constructor(
        private readonly cloudService: CloudService,
        private readonly networkService: NetworkService
    ) {}
    @Query(() => Cloud)
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.CLOUD,
        possession: AuthPossession.ANY,
    })
    public async cloud(): Promise<Cloud> {
        const minigraphql = this.cloudService.checkMothershipClient();
        const cloud = await this.cloudService.checkCloudConnection();

        return {
            relay: {
                // Left in for UPC backwards compat.
                error: undefined,
                status: 'connected',
                timeout: undefined,
            },
            apiKey: { valid: true },
            minigraphql,
            cloud,
            allowedOrigins: this.networkService.getAllowedOrigins(),
            error:
                `${
                    cloud.error ? `NETWORK: ${cloud.error}` : ''
                }${minigraphql.error ? `CLOUD: ${minigraphql.error}` : ''}` || undefined,
        };
    }
}
