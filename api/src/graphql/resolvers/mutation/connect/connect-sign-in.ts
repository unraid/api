import * as cacheManager from 'cache-manager';
import { decodeJwt } from 'jose';

import type { ConnectSignInInput } from '@app/graphql/generated/api/types';
import { getters, store } from '@app/store/index';
import { loginUser } from '@app/store/modules/config';
import { FileLoadStatus } from '@app/store/types';
import { ApiKeyService } from '@app/unraid-api/api-key/api-key.service';

const cache = cacheManager.createCache(cacheManager.memoryStore());


export const connectSignIn = async (input: ConnectSignInInput): Promise<boolean> => {
    if (getters.emhttp().status === FileLoadStatus.LOADED) {
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
            const { remote } = getters.config();
            const { localApiKey: localApiKeyFromConfig } = remote;

            let localApiKeyToUse = localApiKeyFromConfig;

            if (localApiKeyFromConfig == '') {
                const apiKeyService = new ApiKeyService(cache);
                // Create local API key
                const localApiKey = await apiKeyService.createLocalConnectApiKey();

                if (!localApiKey?.key) {
                    throw new Error('Failed to create local API key');
                }

                localApiKeyToUse = localApiKey.key;
            }

            await store.dispatch(
                loginUser({
                    avatar: typeof userInfo.avatar === 'string' ? userInfo.avatar : '',
                    username: userInfo.preferred_username,
                    email: userInfo.email,
                    apikey: input.apiKey,
                    localApiKey: localApiKeyToUse,
                })
            );

            return true;
        } catch (error) {
            throw new Error(`Failed to login user: ${error}`);
        }
    } else {
        return false;
    }
};