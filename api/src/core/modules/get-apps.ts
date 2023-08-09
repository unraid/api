import type { CoreResult } from '@app/core/types';

/**
 * Get all apps.
 */
export const getApps = async (): Promise<CoreResult> => {
	const apps = [];

	return {
		text: `Apps: ${JSON.stringify(apps, null, 2)}`,
		json: apps,
	};
};
