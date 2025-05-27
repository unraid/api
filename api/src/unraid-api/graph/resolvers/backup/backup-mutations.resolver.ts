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
import { BackupOrchestrationService } from '@app/unraid-api/graph/resolvers/backup/orchestration/backup-orchestration.service.js';
import { Resource } from '@app/unraid-api/graph/resolvers/base.model.js';
import { BackupMutations } from '@app/unraid-api/graph/resolvers/mutation/mutation.model.js';
import { RCloneService } from '@app/unraid-api/graph/resolvers/rclone/rclone.service.js';
import { PrefixedID } from '@app/unraid-api/graph/scalars/graphql-type-prefixed-id.js';

@Resolver(() => BackupMutations)
export class BackupMutationsResolver {
    private readonly logger = new Logger(BackupMutationsResolver.name);

    constructor(
        private readonly backupConfigService: BackupConfigService,
        private readonly rcloneService: RCloneService,
        private readonly backupOrchestrationService: BackupOrchestrationService
    ) {}

    private async executeBackup(
        sourcePath: string,
        remoteName: string,
        destinationPath: string,
        options: Record<string, any> = {},
        configId?: string
    ): Promise<BackupStatus> {
        try {
            this.logger.log(`Executing backup: ${sourcePath} -> ${remoteName}:${destinationPath}`);

            // Create a temporary config for the orchestration service
            const tempConfig: BackupJobConfig = {
                id: configId || `temp-${Date.now()}`,
                name: `Manual backup to ${remoteName}`,
                sourceType: 'raw' as any,
                destinationType: 'rclone' as any,
                schedule: '',
                enabled: true,
                sourceConfig: {
                    type: 'raw',
                    sourcePath: sourcePath,
                } as any,
                destinationConfig: {
                    type: 'rclone',
                    remoteName: remoteName,
                    destinationPath: destinationPath,
                    options: options,
                } as any,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const jobId = tempConfig.id;

            // Use the orchestration service for execution
            await this.backupOrchestrationService.executeBackupJob(tempConfig, jobId);

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
        @Args('id', { type: () => PrefixedID }) id: string,
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
    async deleteBackupJobConfig(@Args('id', { type: () => PrefixedID }) id: string): Promise<boolean> {
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
            input.options || {}
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
    async toggleJobConfig(
        @Args('id', { type: () => PrefixedID }) id: string
    ): Promise<BackupJobConfig | null> {
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

        try {
            // Use the orchestration service to execute the backup job
            await this.backupOrchestrationService.executeBackupJob(config, config.id);

            // Update the config with job start information
            await this.backupConfigService.updateBackupJobConfig(id, {
                lastRunStatus: `Started with job ID: ${config.id}`,
                lastRunAt: new Date().toISOString(),
            });

            return {
                status: 'Backup job triggered successfully',
                jobId: config.id,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to trigger backup job ${id}: ${errorMessage}`);

            await this.backupConfigService.updateBackupJobConfig(id, {
                lastRunStatus: `Failed: ${errorMessage}`,
                lastRunAt: new Date().toISOString(),
            });

            return {
                status: `Failed to trigger backup: ${errorMessage}`,
                jobId: undefined,
            };
        }
    }

    @ResolveField(() => BackupStatus, {
        description: 'Stop all running backup jobs',
    })
    @UsePermissions({
        action: AuthActionVerb.DELETE,
        resource: Resource.BACKUP,
        possession: AuthPossession.ANY,
    })
    async stopAllBackupJobs(): Promise<BackupStatus> {
        try {
            const result = await this.rcloneService['rcloneApiService'].stopAllJobs();
            const stoppedCount = result.stopped.length;
            const errorCount = result.errors.length;

            if (stoppedCount > 0) {
                this.logger.log(`Stopped ${stoppedCount} backup jobs`);
            }

            if (errorCount > 0) {
                this.logger.warn(`Failed operations on ${errorCount} jobs: ${result.errors.join(', ')}`);
            }

            return {
                status: `Stopped ${stoppedCount} jobs${errorCount > 0 ? `, ${errorCount} errors` : ''}`,
                jobId: undefined,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to stop backup jobs: ${errorMessage}`);
            return {
                status: `Failed to stop backup jobs: ${errorMessage}`,
                jobId: undefined,
            };
        }
    }

    @ResolveField(() => BackupStatus, {
        description: 'Stop a specific backup job',
    })
    @UsePermissions({
        action: AuthActionVerb.DELETE,
        resource: Resource.BACKUP,
        possession: AuthPossession.ANY,
    })
    async stopBackupJob(@Args('id', { type: () => PrefixedID }) id: string): Promise<BackupStatus> {
        try {
            const result = await this.rcloneService['rcloneApiService'].stopJob(id);
            const stoppedCount = result.stopped.length;
            const errorCount = result.errors.length;

            if (stoppedCount > 0) {
                this.logger.log(`Stopped backup job: ${id}`);
            }

            if (errorCount > 0) {
                this.logger.warn(`Failed to stop job ${id}: ${result.errors.join(', ')}`);
            }

            return {
                status: stoppedCount > 0 ? `Stopped job ${id}` : `Failed to stop job ${id}`,
                jobId: stoppedCount > 0 ? id : undefined,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to stop backup job ${id}: ${errorMessage}`);
            return {
                status: `Failed to stop backup job: ${errorMessage}`,
                jobId: undefined,
            };
        }
    }

    @ResolveField(() => BackupStatus, {
        description: 'Forget all finished backup jobs to clean up the job list',
    })
    @UsePermissions({
        action: AuthActionVerb.DELETE,
        resource: Resource.BACKUP,
        possession: AuthPossession.ANY,
    })
    async forgetFinishedBackupJobs(): Promise<BackupStatus> {
        try {
            this.logger.log('Forgetting finished backup jobs is handled automatically by RClone');
            return {
                status: 'Finished jobs are automatically cleaned up by RClone',
                jobId: undefined,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to forget finished backup jobs: ${errorMessage}`);
            return {
                status: `Failed to forget finished backup jobs: ${errorMessage}`,
                jobId: undefined,
            };
        }
    }
}
