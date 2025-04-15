import { Args, Mutation, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Logger } from '@nestjs/common';

import { Layout } from '@jsonforms/core';
import { GraphQLJSON } from 'graphql-scalars';

import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@app/unraid-api/graph/directives/use-permissions.directive.js';
import { Resource } from '@app/unraid-api/graph/resolvers/base.model.js';
import { RCloneBackupConfigForm, RCloneRemote, CreateRCloneRemoteInput } from '@app/unraid-api/graph/resolvers/rclone/rclone.model.js';
import { RCloneService } from '@app/unraid-api/graph/resolvers/rclone/rclone.service.js';
import { RCloneApiService } from '@app/unraid-api/graph/resolvers/rclone/rclone-api.service.js';
import { DataSlice } from '@app/unraid-api/types/json-forms.js';
import { RCloneFormService } from '@app/unraid-api/graph/resolvers/rclone/rclone-form.service.js';

@Resolver(() => RCloneBackupConfigForm)
export class RCloneConfigResolver {
    private readonly logger = new Logger(RCloneConfigResolver.name);

    constructor(
        private readonly rcloneService: RCloneService,
        private readonly rcloneApiService: RCloneApiService,
        private readonly rcloneFormService: RCloneFormService
    ) {}

    @ResolveField(() => GraphQLJSON)
    async dataSchema(
        @Parent() _parent: RCloneBackupConfigForm
    ): Promise<{ properties: DataSlice; type: 'object' }> {
        const schema = await this.rcloneFormService.dataSchema();
        return {
            properties: schema.properties as DataSlice,
            type: 'object',
        };
    }

    @ResolveField(() => GraphQLJSON)
    async uiSchema(@Parent() _parent: RCloneBackupConfigForm): Promise<Layout> {
        return this.rcloneFormService.uiSchema();
    }

    @Mutation(() => RCloneRemote)
    @UsePermissions({
        action: AuthActionVerb.CREATE,
        resource: Resource.FLASH,
        possession: AuthPossession.ANY,
    })
    async createRCloneRemote(@Args('input') input: CreateRCloneRemoteInput): Promise<RCloneRemote> {
        try {
            await this.rcloneApiService.createRemote(input.name, input.type, input.config);
            return {
                name: input.name,
                type: input.type,
                config: input.config
            };
        } catch (error) {
            this.logger.error(`Error creating remote: ${error}`);
            throw new Error(`Failed to create remote: ${error}`);
        }
    }
}
