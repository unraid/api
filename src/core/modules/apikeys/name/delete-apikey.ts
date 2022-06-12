/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { NotImplementedError } from '@app/core/errors';
import { CoreContext, CoreResult } from '@app/core/types';

interface Context extends CoreContext {
	params: {
		username: string;
	};
	data: {
		password: string;
	};
}

/**
 * Invalidate an apiKey.
 * @returns The deleted apikey.
 */
export const deleteApikey = async (_: Context): Promise<CoreResult> => {
	throw new NotImplementedError();
};
