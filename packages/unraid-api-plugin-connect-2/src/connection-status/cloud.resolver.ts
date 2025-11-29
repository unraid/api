import { Query, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import {
    UsePermissions,
} from '@unraid/shared/use-permissions.directive.js';

import { NetworkService } from '../network/network.service.js';
import { Cloud } from './cloud.model.js';
import { CloudService } from './cloud.service.js';

/**
 * Exposes details about the connection to the Unraid Connect cloud.
 */
@Resolver(() => Cloud)
export class CloudResolver {
    constructor(
        private readonly cloudService: CloudService,
        private readonly networkService: NetworkService
    ) {}
    @Query(() => Cloud)
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.CLOUD,
    })
    public async cloud(): Promise<Cloud> {
        const minigraphql = this.cloudService.checkMothershipClient();
        const cloud = await this.cloudService.checkCloudConnection();

        const cloudError = cloud.error ? `NETWORK: ${cloud.error}` : '';
        const miniGraphError = minigraphql.error ? `CLOUD: ${minigraphql.error}` : '';

        let error = cloudError || miniGraphError || undefined;
        if (cloudError && miniGraphError) {
            error = `${cloudError}\n${miniGraphError}`;
        }

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
            error,
        };
    }
}
