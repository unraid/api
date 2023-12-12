import { getAllowedOrigins } from '@app/common/allowed-origins';
import { type AllowedOriginInput, ConfigErrorState } from '@app/graphql/generated/api/types';
import { getters, store } from '@app/store/index';
import { updateAllowedOrigins } from '@app/store/modules/config';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseRoles } from 'nest-access-control';

@Resolver('Config')
export class ConfigResolver {
    @Query()
    @UseRoles({
        resource: 'config',
        action: 'read',
        possession: 'any',
    })
    public async config() {
        const emhttp = getters.emhttp();
        return {
            valid: emhttp.var.configValid,
            error: emhttp.var.configValid
                ? null
                : ConfigErrorState[emhttp.var.configState] ??
                  ConfigErrorState.UNKNOWN_ERROR,
        };
    }

    @Mutation('setAdditionalAllowedOrigins')
    @UseRoles({
        resource: 'config',
        action: 'update',
        possession: 'own',
    })
    public async setAdditionalAllowedOrigins(@Args('input') input: AllowedOriginInput) {
        await store.dispatch(updateAllowedOrigins(input.origins));
        return getAllowedOrigins();
    }
}
