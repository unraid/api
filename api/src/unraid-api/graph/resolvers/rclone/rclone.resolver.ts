import { Logger } from '@nestjs/common';
import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';

import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@app/unraid-api/graph/directives/use-permissions.directive.js';
import { Resource } from '@app/unraid-api/graph/resolvers/base.model.js';
import { RCloneApiService } from '@app/unraid-api/graph/resolvers/rclone/rclone-api.service.js';
import { RCloneFormService } from '@app/unraid-api/graph/resolvers/rclone/rclone-form.service.js';
import {
    CreateRCloneRemoteInput,
    RCloneBackupConfigForm,
    RCloneBackupSettings,
    RCloneConfigFormInput,
    RCloneRemote,
} from '@app/unraid-api/graph/resolvers/rclone/rclone.model.js';
import { RCloneService } from '@app/unraid-api/graph/resolvers/rclone/rclone.service.js';
import { DataSlice } from '@app/unraid-api/types/json-forms.js';

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
        @Args('formOptions', { type: () => RCloneConfigFormInput, nullable: true })
        formOptions?: RCloneConfigFormInput
    ): Promise<RCloneBackupConfigForm> {
        const form = await this.rcloneFormService.getFormSchemas(formOptions ?? {});
        return {
            id: 'rcloneBackupConfigForm',
            dataSchema: form.dataSchema as { properties: DataSlice; type: 'object' },
            uiSchema: form.uiSchema,
        };
    }

    @Mutation(() => RCloneRemote)
    @UsePermissions({
        action: AuthActionVerb.CREATE,
        resource: Resource.FLASH,
        possession: AuthPossession.ANY,
    })
    async createRCloneRemote(@Args('input') input: CreateRCloneRemoteInput): Promise<RCloneRemote> {
        try {
            await this.rcloneApiService.createRemote(input.name, input.type, input.parameters);
            return {
                name: input.name,
                type: input.type,
                parameters: input.parameters,
            };
        } catch (error) {
            this.logger.error(`Error creating remote: ${error}`);
            throw new Error(`Failed to create remote: ${error}`);
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
