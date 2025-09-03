import { Logger } from '@nestjs/common';
import { Args, ResolveField, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

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
        action: AuthAction.CREATE_ANY,
        resource: Resource.FLASH,
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
        action: AuthAction.DELETE_ANY,
        resource: Resource.FLASH,
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
