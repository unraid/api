import { decodeJwt } from 'jose';

import type { ConnectSignInInput } from '@app/graphql/generated/api/types';
import { NODE_ENV } from '@app/environment';
import { Role } from '@app/graphql/generated/api/types';
import { API_KEY_STATUS } from '@app/mothership/api-key/api-key-types';
import { validateApiKeyWithKeyServer } from '@app/mothership/api-key/validate-api-key-with-keyserver';
import { getters, store } from '@app/store/index';
import { loginUser } from '@app/store/modules/config';
import { FileLoadStatus } from '@app/store/types';
import { ApiKeyService } from '@app/unraid-api/auth/api-key.service';

export const connectSignIn = async (input: ConnectSignInInput): Promise<boolean> => {
    if (getters.emhttp().status === FileLoadStatus.LOADED) {
        const result =
            NODE_ENV === 'development'
                ? API_KEY_STATUS.API_KEY_VALID
                : await validateApiKeyWithKeyServer({
                      apiKey: input.apiKey,
                      flashGuid: getters.emhttp().var.flashGuid,
                  });
        if (result !== API_KEY_STATUS.API_KEY_VALID) {
            throw new Error(`Validating API Key Failed with Error: ${result}`);
        }

        const userInfo = input.idToken ? decodeJwt(input.idToken) : (input.userInfo ?? null);
        if (
            !userInfo ||
            !userInfo.preferred_username ||
            !userInfo.email ||
            typeof userInfo.preferred_username !== 'string' ||
            typeof userInfo.email !== 'string'
        ) {
            throw new Error('Missing User Attributes');
        }

        try {
            const apiKeyService = new ApiKeyService();
            // Create local API key
            const localApiKey = await apiKeyService.create(
                `Local Key - ${userInfo.preferred_username}`,
                `Local API key for Connect user ${userInfo.email}`,
                [Role.GUEST, Role.ADMIN]
            );

            if (!localApiKey?.key) {
                throw new Error('Failed to create local API key');
            }

            await store.dispatch(
                loginUser({
                    avatar: typeof userInfo.avatar === 'string' ? userInfo.avatar : '',
                    username: userInfo.preferred_username,
                    email: userInfo.email,
                    apikey: input.apiKey,
                    localApiKey: localApiKey.key,
                })
            );

            return true;
        } catch (error) {
            throw new Error(`Failed to create local API key: ${error}`);
        }
    } else {
        return false;
    }
};
