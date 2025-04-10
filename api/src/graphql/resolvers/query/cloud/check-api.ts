import { logger } from '@app/core/log.js';
import { type ApiKeyResponse } from '@app/unraid-api/graph/resolvers/cloud/cloud.model.js';

export const checkApi = async (): Promise<ApiKeyResponse> => {
    logger.trace('Cloud endpoint: Checking API');
    return { valid: true };
};
