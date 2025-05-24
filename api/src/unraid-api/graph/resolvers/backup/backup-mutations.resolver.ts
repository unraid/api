import { Logger } from '@nestjs/common';
import { Args, ResolveField, Resolver } from '@nestjs/graphql';

import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@app/unraid-api/graph/directives/use-permissions.directive.js';
import { BackupConfigService } from '@app/unraid-api/graph/resolvers/backup/backup-config.service.js';
import {
    BackupJobConfig,
    BackupStatus,
    CreateBackupJobConfigInput,
    InitiateBackupInput,
    UpdateBackupJobConfigInput,
} from '@app/unraid-api/graph/resolvers/backup/backup.model.js';
import { Resource } from '@app/unraid-api/graph/resolvers/base.model.js';
import { BackupMutations } from '@app/unraid-api/graph/resolvers/mutation/mutation.model.js';
import { RCloneService } from '@app/unraid-api/graph/resolvers/rclone/rclone.service.js';
import { PrefixedID } from '@app/unraid-api/graph/scalars/graphql-type-prefixed-id.js';

@Resolver(() => BackupMutations)
export class BackupMutationsResolver {
    private readonly logger = new Logger(BackupMutationsResolver.name);

    constructor(
        private readonly backupConfigService: BackupConfigService,
        private readonly rcloneService: RCloneService
    ) {}

    private async executeBackup(
        sourcePath: string,
        remoteName: string,
        destinationPath: string,
        options: Record<string, any> = {},
        group: string
    ): Promise<BackupStatus> {
        try {
            this.logger.log(
                `Executing backup: ${sourcePath} -> ${remoteName}:${destinationPath} (group: ${group})`
            );

            const result = await this.rcloneService['rcloneApiService'].startBackup({
                srcPath: sourcePath,
                dstPath: `${remoteName}:${destinationPath}`,
                async: true,
                group: group,
                options: options,
            });

            this.logger.debug(`RClone startBackup result: ${JSON.stringify(result)}`);

            const jobId = result.jobid || result.jobId;
            this.logger.log(`Backup job initiated successfully with ID: ${jobId}`);

            return {
                status: 'Backup initiated successfully',
                jobId: jobId,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(
                `Failed to execute backup: ${errorMessage}`,
                error instanceof Error ? error.stack : undefined
            );

            return {
                status: `Failed to initiate backup: ${errorMessage}`,
                jobId: undefined,
            };
        }
    }

    @ResolveField(() => BackupJobConfig, {
        description: 'Create a new backup job configuration',
    })
    @UsePermissions({
        action: AuthActionVerb.CREATE,
        resource: Resource.BACKUP,
        possession: AuthPossession.ANY,
    })
    async createBackupJobConfig(
        @Args('input') input: CreateBackupJobConfigInput
    ): Promise<BackupJobConfig> {
        return this.backupConfigService.createBackupJobConfig(input);
    }

    @ResolveField(() => BackupJobConfig, {
        description: 'Update a backup job configuration',
        nullable: true,
    })
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.BACKUP,
        possession: AuthPossession.ANY,
    })
    async updateBackupJobConfig(
        @Args('id') id: string,
        @Args('input') input: UpdateBackupJobConfigInput
    ): Promise<BackupJobConfig | null> {
        return this.backupConfigService.updateBackupJobConfig(id, input);
    }

    @ResolveField(() => Boolean, {
        description: 'Delete a backup job configuration',
    })
    @UsePermissions({
        action: AuthActionVerb.DELETE,
        resource: Resource.BACKUP,
        possession: AuthPossession.ANY,
    })
    async deleteBackupJobConfig(@Args('id') id: string): Promise<boolean> {
        return this.backupConfigService.deleteBackupJobConfig(id);
    }

    @ResolveField(() => BackupStatus, {
        description: 'Initiates a backup using a configured remote.',
    })
    @UsePermissions({
        action: AuthActionVerb.CREATE,
        resource: Resource.BACKUP,
        possession: AuthPossession.ANY,
    })
    async initiateBackup(@Args('input') input: InitiateBackupInput): Promise<BackupStatus> {
        return this.executeBackup(
            input.sourcePath,
            input.remoteName,
            input.destinationPath,
            input.options || {},
            'backup/manual'
        );
    }

    @ResolveField(() => BackupJobConfig, {
        description: 'Toggle a backup job configuration enabled/disabled',
        nullable: true,
    })
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.BACKUP,
        possession: AuthPossession.ANY,
    })
    async toggleJobConfig(@Args('id') id: string): Promise<BackupJobConfig | null> {
        const existing = await this.backupConfigService.getBackupJobConfig(id);
        if (!existing) return null;

        return this.backupConfigService.updateBackupJobConfig(id, {
            enabled: !existing.enabled,
        });
    }

    @ResolveField(() => BackupStatus, {
        description: 'Manually trigger a backup job using existing configuration',
    })
    @UsePermissions({
        action: AuthActionVerb.CREATE,
        resource: Resource.BACKUP,
        possession: AuthPossession.ANY,
    })
    async triggerJob(@Args('id', { type: () => PrefixedID }) id: string): Promise<BackupStatus> {
        const config = await this.backupConfigService.getBackupJobConfig(id);
        if (!config) {
            return {
                status: 'Failed to trigger backup: Configuration not found',
                jobId: undefined,
            };
        }

        return this.executeBackup(
            config.sourcePath,
            config.remoteName,
            config.destinationPath,
            config.rcloneOptions || {},
            `backup/${id}`
        );
    }
}
