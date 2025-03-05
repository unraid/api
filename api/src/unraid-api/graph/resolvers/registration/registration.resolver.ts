import { Query, Resolver, Subscription } from '@nestjs/graphql';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import type { Registration } from '@app/unraid-api/plugins/connect/api/graphql/generated/api/types.js';
import { createSubscription, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { getKeyFile } from '@app/core/utils/misc/get-key-file.js';
import { registrationType, Resource } from '@app/unraid-api/plugins/connect/api/graphql/generated/api/types.js';
import { getters } from '@app/store/index.js';
import { FileLoadStatus } from '@app/store/types.js';

@Resolver('Registration')
export class RegistrationResolver {
    @Query()
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.REGISTRATION,
        possession: AuthPossession.ANY,
    })
    public async registration() {
        const emhttp = getters.emhttp();
        if (emhttp.status !== FileLoadStatus.LOADED || !emhttp.var?.regTy) {
            return null;
        }

        const isTrial = emhttp.var.regTy === registrationType.TRIAL;
        const isExpired = emhttp.var.regTy.includes('expired');

        const registration: Registration = {
            guid: emhttp.var.regGuid,
            type: emhttp.var.regTy,
            state: emhttp.var.regState,
            // Based on https://github.com/unraid/dynamix.unraid.net/blob/c565217fa8b2acf23943dc5c22a12d526cdf70a1/source/dynamix.unraid.net/usr/local/emhttp/plugins/dynamix.my.servers/include/state.php#L64
            expiration: (1_000 * (isTrial || isExpired ? Number(emhttp.var.regTm2) : 0)).toString(),
            updateExpiration: emhttp.var.regExp ? (Number(emhttp.var.regExp) * 1_000).toString() : null,
            keyFile: {
                location: emhttp.var.regFile,
                contents: await getKeyFile(),
            },
        };
        return registration;
    }

    @Subscription('registration')
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.REGISTRATION,
        possession: AuthPossession.ANY,
    })
    public registrationSubscription() {
        return createSubscription(PUBSUB_CHANNEL.REGISTRATION);
    }
}
