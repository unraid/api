import { Logger } from '@nestjs/common';
import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';

import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@app/unraid-api/graph/directives/use-permissions.directive.js';
import { Resource } from '@app/unraid-api/graph/resolvers/base.model.js';
import { RCloneApiService } from '@app/unraid-api/graph/resolvers/rclone/rclone-api.service.js';
import { RCloneFormService } from '@app/unraid-api/graph/resolvers/rclone/rclone-form.service.js';
import {
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
    async rclone(): Promise<RCloneBackupSettings> {
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

    @ResolveField(() => [RCloneRemote])
    async remotes(@Parent() _parent: RCloneBackupSettings): Promise<RCloneRemote[]> {
        try {
            return await this.rcloneService.getRemoteDetails();
        } catch (error) {
            this.logger.error(`Error listing remotes: ${error}`);
            return [];
        }
    }
}
