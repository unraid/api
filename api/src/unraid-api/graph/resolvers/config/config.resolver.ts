import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import type { AllowedOriginInput } from '@app/graphql/generated/api/types.js';
import { getAllowedOrigins } from '@app/common/allowed-origins.js';
import { Config, Resource } from '@app/graphql/generated/api/types.js';
import { getters, store } from '@app/store/index.js';
import { updateAllowedOrigins } from '@app/store/modules/config.js';

@Resolver('Config')
export class ConfigResolver {
    @Query()
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.CONFIG,
        possession: AuthPossession.ANY,
    })
    public async config(): Promise<Config> {
        const emhttp = getters.emhttp();
        return {
            id: 'config',
            valid: emhttp.var.configValid,
            error: emhttp.var.configValid ? null : emhttp.var.configErrorState,
        };
    }

    @Mutation('setAdditionalAllowedOrigins')
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.CONFIG,
        possession: AuthPossession.ANY,
    })
    public async setAdditionalAllowedOrigins(@Args('input') input: AllowedOriginInput) {
        await store.dispatch(updateAllowedOrigins(input.origins));
        return getAllowedOrigins();
    }
}
