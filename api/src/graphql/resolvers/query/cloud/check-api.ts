import { logger } from '@app/core/log.js';
import { type ApiKeyResponse } from '@app/graphql/generated/api/types.js';

export const checkApi = async (): Promise<ApiKeyResponse> => {
    logger.trace('Cloud endpoint: Checking API');
    return { valid: true };
};
