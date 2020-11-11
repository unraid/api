/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { getNodeService, NodeService } from '../../utils';
import { CoreContext, CoreResult } from '../../types';

const namespace = 'node-api';

interface Result extends CoreResult {
	json: NodeService
}

/**
 * Get node api service info.
 */
export const getNodeApiService = async(context: CoreContext): Promise<Result> => {
	const service = await getNodeService(context.user, namespace);
	return {
		text: `Service: ${JSON.stringify(service, null, 2)}`,
		json: service
	};
};
