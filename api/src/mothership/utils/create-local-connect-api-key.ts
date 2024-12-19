import { minigraphLogger } from '@app/core/log';
import { getters, store } from '@app/store/index';
import { updateUserConfig } from '@app/store/modules/config';
import { FileLoadStatus } from '@app/store/types';
import { ApiKeyService } from '@app/unraid-api/auth/api-key.service';

export const createLocalApiKeyForConnectIfNecessary = async () => {
    if (getters.config().status !== FileLoadStatus.LOADED) {
        minigraphLogger.error('Config file not loaded, cannot create local API key');
        return;
    }

    const { remote } = getters.config();
    const service = new ApiKeyService();
    // If the remote API Key is set and the local key is either not set or not found on disk, create a key
    if (remote.apikey && (!remote.localApiKey || !(await service.findById(remote.localApiKey)))) {
        minigraphLogger.debug('Creating local API key for Connect');
        // Create local API key
        const apiKeyService = new ApiKeyService();
        const localApiKey = await apiKeyService.createLocalConnectApiKey();

        if (localApiKey?.key) {
            store.dispatch(
                updateUserConfig({
                    remote: {
                        localApiKey: localApiKey.key,
                    },
                })
            );
        } else {
            throw new Error('Failed to create local API key - no key returned');
        }
    }
};
