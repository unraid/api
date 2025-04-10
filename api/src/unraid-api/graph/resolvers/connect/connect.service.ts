import { Injectable, Logger } from '@nestjs/common';

import { execa } from 'execa';
import { decodeJwt } from 'jose';

import { getters, store } from '@app/store/index.js';
import { loginUser } from '@app/store/modules/config.js';
import { FileLoadStatus } from '@app/store/types.js';
import { ApiKeyService } from '@app/unraid-api/auth/api-key.service.js';
import { ConnectSignInInput } from '@app/unraid-api/graph/resolvers/connect/connect.model.js';

@Injectable()
export class ConnectService {
    constructor(private readonly apiKeyService: ApiKeyService) {}
    private logger = new Logger(ConnectService.name);
    async restartApi() {
        try {
            await execa('unraid-api', ['restart'], { shell: 'bash', stdio: 'ignore' });
        } catch (error) {
            this.logger.error(error);
        }
    }

    async signIn(input: ConnectSignInInput) {
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
                    // Create local API key
                    const localApiKey = await this.apiKeyService.createLocalConnectApiKey();

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
    }
}
