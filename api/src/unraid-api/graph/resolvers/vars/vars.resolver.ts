import { Query, Resolver } from '@nestjs/graphql';

import { Resource } from '@unraid/shared/graphql.model.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@unraid/shared/use-permissions.directive.js';

import { getters } from '@app/store/index.js';
import { Public } from '@app/unraid-api/auth/public.decorator.js';
import { RegistrationState } from '@app/unraid-api/graph/resolvers/registration/registration.model.js';
import { Vars } from '@app/unraid-api/graph/resolvers/vars/vars.model.js';

@Resolver(() => Vars)
export class VarsResolver {
    @Query(() => Vars)
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.VARS,
        possession: AuthPossession.ANY,
    })
    public async vars() {
        return {
            id: 'vars',
            ...(getters.emhttp().var ?? {}),
        };
    }

    @Query(() => Boolean)
    @Public()
    public async isInitialSetup() {
        return getters.emhttp().var?.regState === RegistrationState.ENOKEYFILE;
    }
}
