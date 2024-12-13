import { logger } from '@app/core/log';
import { NODE_ENV } from '@app/environment';
import { Role } from '@app/graphql/generated/api/types';
import { API_KEY_STATUS } from '@app/mothership/api-key/api-key-types';
import { validateApiKeyWithKeyServer } from '@app/mothership/api-key/validate-api-key-with-keyserver';
import { getters } from '@app/store/index';
import { startAppListening } from '@app/store/listeners/listener-middleware';
import { updateUserConfig } from '@app/store/modules/config';
import { FileLoadStatus } from '@app/store/types';
import { ApiKeyService } from '@app/unraid-api/auth/api-key.service';

export const enableLocalApiKeyListener = () =>
    startAppListening({
        predicate(_, currentState) {
            return (
                currentState.config.status === FileLoadStatus.LOADED &&
                currentState.config.remote.apikey !== '' &&
                currentState.config.remote.localApiKey === ''
            );
        },
        async effect(_, { dispatch }) {
            try {
                const { remote } = getters.config();
                const { apikey, username } = remote;
                // Validate the API key with the key server
                const validationResult =
                    NODE_ENV === 'development'
                        ? API_KEY_STATUS.API_KEY_VALID
                        : await validateApiKeyWithKeyServer({
                              apiKey: apikey as string,
                              flashGuid: getters.emhttp().var.flashGuid,
                          });

                if (validationResult !== API_KEY_STATUS.API_KEY_VALID) {
                    throw new Error('API key validation failed');
                }

                const apiKeyService = new ApiKeyService();
                // Create local API key
                const localApiKey = await apiKeyService.create(
                    `LOCAL_KEY_${(username as string).toUpperCase()}`,
                    `Local API key for Connect user ${username}`,
                    [Role.ADMIN]
                );

                if (localApiKey?.key) {
                    dispatch(
                        updateUserConfig({
                            remote: {
                                localApiKey: localApiKey.key,
                            },
                        })
                    );
                } else {
                    throw new Error('Failed to create local API key - no key returned');
                }
            } catch (error) {
                logger.error('Failed to create local API key', error);
            }
        },
    });
