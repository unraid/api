import { Logger } from '@nestjs/common';
import { Args, ResolveField, Resolver } from '@nestjs/graphql';

import { Resource } from '@unraid/shared/graphql.model.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@unraid/shared/use-permissions.directive.js';

import { RCloneMutations } from '@app/unraid-api/graph/resolvers/mutation/mutation.model.js';
import { RCloneApiService } from '@app/unraid-api/graph/resolvers/rclone/rclone-api.service.js';
import {
    CreateRCloneRemoteInput,
    DeleteRCloneRemoteInput,
    RCloneRemote,
} from '@app/unraid-api/graph/resolvers/rclone/rclone.model.js';

/**
 * Nested Resolvers for Mutations MUST use @ResolveField() instead of @Mutation()
 */
@Resolver(() => RCloneMutations)
export class RCloneMutationsResolver {
    private readonly logger = new Logger(RCloneMutationsResolver.name);

    constructor(private readonly rcloneApiService: RCloneApiService) {}

    @ResolveField(() => RCloneRemote, { description: 'Create a new RClone remote' })
    @UsePermissions({
        action: AuthActionVerb.CREATE,
        resource: Resource.FLASH,
        possession: AuthPossession.ANY,
    })
    async createRCloneRemote(@Args('input') input: CreateRCloneRemoteInput): Promise<RCloneRemote> {
        try {
            const config = await this.rcloneApiService.createRemote(input);
            return {
                name: input.name,
                type: input.type,
                parameters: {},
                config,
            };
        } catch (error) {
            this.logger.error(`Error creating remote: ${error}`);
            throw new Error(`Failed to create remote: ${error}`);
        }
    }

    @ResolveField(() => Boolean, { description: 'Delete an existing RClone remote' })
    @UsePermissions({
        action: AuthActionVerb.DELETE,
        resource: Resource.FLASH,
        possession: AuthPossession.ANY,
    })
    async deleteRCloneRemote(@Args('input') input: DeleteRCloneRemoteInput): Promise<boolean> {
        try {
            await this.rcloneApiService.deleteRemote(input);
            return true;
        } catch (error) {
            this.logger.error(`Error deleting remote: ${error}`);
            throw new Error(`Failed to delete remote: ${error}`);
        }
    }
}
