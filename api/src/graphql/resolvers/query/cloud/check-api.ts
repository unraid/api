import { logger } from '@app/core/log';
import { type ApiKeyResponse } from '@app/graphql/generated/api/types';

export const checkApi = async (): Promise<ApiKeyResponse> => {
	logger.trace('Cloud endpoint: Checking API');
	return { valid: true };
};
