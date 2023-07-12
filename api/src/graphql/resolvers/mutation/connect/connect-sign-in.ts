import { ensurePermission } from '@app/core/utils/index';
import { type MutationResolvers } from '@app/graphql/generated/api/types';
import { API_KEY_STATUS } from '@app/mothership/api-key/api-key-types';
import { validateApiKeyWithKeyServer } from '@app/mothership/api-key/validate-api-key-with-keyserver';
import { getters, store } from '@app/store/index';
import { setApiKeyState } from '@app/store/modules/apikey';
import { loginUser, signIn } from '@app/store/modules/config';
import { FileLoadStatus } from '@app/store/types';
import { GraphQLError } from 'graphql';
import { decodeJwt } from 'jose';

export const connectSignIn: MutationResolvers['connectSignIn'] = async (
    _,
    args,
    context
) => {
    ensurePermission(context.user, {
        resource: 'connect',
        possession: 'own',
        action: 'update'
    })

    if (getters.emhttp().status === FileLoadStatus.LOADED) {
    const result = await validateApiKeyWithKeyServer({apiKey: args.input.apiKey, flashGuid: getters.emhttp().var.flashGuid });
    if (result !== API_KEY_STATUS.API_KEY_VALID) {
        throw new GraphQLError(`Validating API Key Failed with Error: ${result}`);
    }

    const userInfo = decodeJwt(args.input.idToken);
    if (!userInfo.preferred_username || !userInfo.email || typeof userInfo.preferred_username !== 'string' || typeof userInfo.email !== 'string') {
        throw new GraphQLError('Missing attributes on provided idToken')
    }
    store.dispatch(setApiKeyState(API_KEY_STATUS.API_KEY_VALID));
    store.dispatch(signIn({ apikey: args.input.apiKey }));
    // @TODO once we deprecate old sign in method, switch this to do all validation requests
    await store.dispatch(
        loginUser({
            avatar: '',
            username: userInfo.preferred_username,
            email: userInfo.email,
        })
    );
    return true;
    } else {
        return false;
    }
};
