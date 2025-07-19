import { Query, Resolver } from '@nestjs/graphql';

import { Resource } from '@unraid/shared/graphql.model.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@unraid/shared/use-permissions.directive.js';

import { getKeyFile } from '@app/core/utils/misc/get-key-file.js';
import { getters } from '@app/store/index.js';
import { FileLoadStatus } from '@app/store/types.js';
import {
    Registration,
    RegistrationType,
} from '@app/unraid-api/graph/resolvers/registration/registration.model.js';

@Resolver(() => Registration)
export class RegistrationResolver {
    @Query(() => Registration, { nullable: true })
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.REGISTRATION,
        possession: AuthPossession.ANY,
    })
    public async registration(): Promise<Registration | null> {
        const emhttp = getters.emhttp();
        if (emhttp.status !== FileLoadStatus.LOADED || !emhttp.var?.regTy) {
            return null;
        }

        const isTrial = emhttp.var.regTy === RegistrationType.TRIAL;
        const isExpired = emhttp.var.regTy.includes('expired');

        const registration: Registration = {
            id: emhttp.var.regGuid,
            type: emhttp.var.regTy,
            state: emhttp.var.regState,
            // Based on https://github.com/unraid/dynamix.unraid.net/blob/c565217fa8b2acf23943dc5c22a12d526cdf70a1/source/dynamix.unraid.net/usr/local/emhttp/plugins/dynamix.my.servers/include/state.php#L64
            expiration: (1_000 * (isTrial || isExpired ? Number(emhttp.var.regTm2) : 0)).toString(),
            updateExpiration: emhttp.var.regExp
                ? (Number(emhttp.var.regExp) * 1_000).toString()
                : undefined,
            keyFile: {
                location: emhttp.var.regFile,
                contents: (await getKeyFile()) ?? undefined,
            },
        };
        return registration;
    }
}
