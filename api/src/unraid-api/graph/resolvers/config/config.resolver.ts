import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import type { AllowedOriginInput } from '@app/graphql/generated/api/types';
import { getAllowedOrigins } from '@app/common/allowed-origins';
import { Config, ConfigErrorState, Resource } from '@app/graphql/generated/api/types';
import { getters, store } from '@app/store/index';
import { updateAllowedOrigins } from '@app/store/modules/config';

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
            error: emhttp.var.configValid
                ? null
                : (ConfigErrorState[emhttp.var.configState] ?? ConfigErrorState.UNKNOWN_ERROR),
        };
    }

    @Mutation('setAdditionalAllowedOrigins')
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.CONFIG,
        possession: AuthPossession.OWN,
    })
    public async setAdditionalAllowedOrigins(@Args('input') input: AllowedOriginInput) {
        await store.dispatch(updateAllowedOrigins(input.origins));
        return getAllowedOrigins();
    }
}
