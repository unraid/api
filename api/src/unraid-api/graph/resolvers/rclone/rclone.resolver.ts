import { Logger } from '@nestjs/common';
import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-scalars';

import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@app/unraid-api/graph/directives/use-permissions.directive.js';
import { Resource } from '@app/unraid-api/graph/resolvers/base.model.js';
import { RCloneApiService } from '@app/unraid-api/graph/resolvers/rclone/rclone-api.service.js';
import {
    RCloneBackupSettings,
    RCloneBackupConfigForm,
    RCloneDrive,
} from '@app/unraid-api/graph/resolvers/rclone/rclone.model.js';

import { RCloneService } from './rclone.service.js';
import { RCloneFormService } from './rclone-form.service.js';

@Resolver(() => RCloneBackupSettings)
export class RCloneBackupSettingsResolver {
    private readonly logger = new Logger(RCloneBackupSettingsResolver.name);

    constructor(
        private readonly rcloneService: RCloneService,
        private readonly rcloneApiService: RCloneApiService,
        private readonly rcloneFormService: RCloneFormService
    ) {}

    @Query(() => RCloneBackupSettings)
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.FLASH,
        possession: AuthPossession.ANY,
    })
    async rcloneBackup(): Promise<RCloneBackupSettings> {
        return {} as RCloneBackupSettings;
    }

    @ResolveField(() => RCloneBackupConfigForm)
    async configForm(
        @Parent() _parent: RCloneBackupSettings, 
        @Args('providerType', { nullable: true }) providerType?: string, 
        @Args('parameters', { type: () => GraphQLJSON, nullable: true }) parameters?: Record<string, unknown>
    ): Promise<RCloneBackupConfigForm> {
        // Return basic form info without generating schema data - this will be handled by RCloneConfigResolver
        return {
            id: 'rcloneBackupConfigForm',
        } as RCloneBackupConfigForm;
    }

    @ResolveField(() => [RCloneDrive])
    async drives(@Parent() _parent: RCloneBackupSettings): Promise<RCloneDrive[]> {
        try {
            const providers = await this.rcloneApiService.getProviders();

            return providers.map(provider => ({
                name: provider.name,
                options: provider.options as unknown as Record<string, unknown>,
            }));
        } catch (error) {
            this.logger.error(`Error getting providers: ${error}`);
            return [];
        }
    }

    @ResolveField(() => [String])
    async remotes(@Parent() _parent: RCloneBackupSettings): Promise<string[]> {
        try {
            return await this.rcloneApiService.listRemotes();
        } catch (error) {
            this.logger.error(`Error listing remotes: ${error}`);
            return [];
        }
    }
}
