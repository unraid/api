import { PUBSUB_CHANNEL, createSubscription } from '@app/core/pubsub';
import { getKeyFile } from '@app/core/utils/misc/get-key-file';
import {
    registrationType,
    type Registration,
} from '@app/graphql/generated/api/types';
import { getters } from '@app/store/index';
import { FileLoadStatus } from '@app/store/types';
import { Query, Resolver, Subscription } from '@nestjs/graphql';
import { UseRoles } from 'nest-access-control';

@Resolver()
export class RegistrationResolver {
    @Query()
    @UseRoles({
        resource: 'registration',
        action: 'read',
        possession: 'any',
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
            expiration: (
                1_000 * (isTrial || isExpired ? Number(emhttp.var.regTm2) : 0)
            ).toString(),
            keyFile: {
                location: emhttp.var.regFile,
                contents: await getKeyFile(),
            },
        };
        return registration;
    }

    @Subscription('registration')
    @UseRoles({
        resource: 'registration',
        action: 'read',
        possession: 'any',
    })
    public registrationSubscription() {
        return createSubscription(PUBSUB_CHANNEL.REGISTRATION);
    }
}
