import { writeFileSync } from 'fs';

import { logger } from '@app/core/log';
import { getWriteableConfig } from '@app/core/utils/files/config-file-normalizer';
import { safelySerializeObjectToIni } from '@app/core/utils/files/safe-ini-serializer';
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
        async effect(_, { dispatch, getState }) {
            try {
                const currentState = getState();
                const apiKey = currentState.config.remote.apikey;
                const username = currentState.config.remote.username;

                // Validate the API key with the key server
                const validationResult = await validateApiKeyWithKeyServer({
                    apiKey,
                    flashGuid: getters.emhttp().var.flashGuid,
                });

                if (validationResult !== API_KEY_STATUS.API_KEY_VALID) {
                    throw new Error('API key validation failed');
                }

                const apiKeyService = new ApiKeyService();
                // Create local API key
                const localApiKey = await apiKeyService.create(
                    `Local Key - ${username}`,
                    `Local API key for Connect user ${username}`,
                    [Role.GUEST, Role.ADMIN]
                );

                if (localApiKey?.key) {
                    const { paths, config } = getState();
                    const writeableConfig = getWriteableConfig(config, 'flash');

                    writeableConfig.remote.localApiKey = localApiKey.key;

                    const serializedConfig = safelySerializeObjectToIni(writeableConfig);

                    logger.debug(
                        'Writing updated config with local API key to %s',
                        paths['myservers-config']
                    );

                    writeFileSync(paths['myservers-config'], serializedConfig);

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
