import { Inject, Logger } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import {
    FlashBackupStatus,
    InitiateFlashBackupInput,
} from '@app/unraid-api/graph/resolvers/flash-backup/flash-backup.model.js';
import { RCloneService } from '@app/unraid-api/graph/resolvers/rclone/rclone.service.js';

@Resolver()
export class FlashBackupResolver {
    private readonly logger = new Logger(FlashBackupResolver.name);

    constructor() {}

    @UsePermissions({
        action: AuthAction.CREATE_ANY,
        resource: Resource.FLASH,
    })
    @Mutation(() => FlashBackupStatus, {
        description: 'Initiates a flash drive backup using a configured remote.',
    })
    async initiateFlashBackup(
        @Args('input') input: InitiateFlashBackupInput
    ): Promise<FlashBackupStatus> {
        throw new Error('Not implemented');
    }
}
