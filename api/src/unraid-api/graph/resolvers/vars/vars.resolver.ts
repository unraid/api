import { Logger } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { getters } from '@app/store/index.js';
import { InternalBootStateService } from '@app/unraid-api/graph/resolvers/disks/internal-boot-state.service.js';
import { UpdateSshInput, Vars } from '@app/unraid-api/graph/resolvers/vars/vars.model.js';
import { VarsService } from '@app/unraid-api/graph/resolvers/vars/vars.service.js';

@Resolver(() => Vars)
export class VarsResolver {
    private readonly logger = new Logger(VarsResolver.name);

    constructor(
        private readonly varsService: VarsService,
        private readonly internalBootStateService: InternalBootStateService
    ) {}

    @Query(() => Vars)
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.VARS,
    })
    public async vars() {
        let bootedFromFlashWithInternalBootSetup: boolean | null = null;
        try {
            bootedFromFlashWithInternalBootSetup =
                await this.internalBootStateService.getBootedFromFlashWithInternalBootSetup();
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(
                `Failed to resolve bootedFromFlashWithInternalBootSetup in vars(): ${message}`
            );
        }

        return {
            id: 'vars',
            ...(getters.emhttp().var ?? {}),
            bootedFromFlashWithInternalBootSetup,
        };
    }

    @Mutation(() => Vars)
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.VARS,
    })
    public async updateSshSettings(@Args('input') input: UpdateSshInput) {
        return this.varsService.updateSshSettings(input.enabled, input.port);
    }
}
