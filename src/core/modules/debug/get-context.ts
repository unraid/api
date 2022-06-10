/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { CoreContext, CoreResult } from '../../types';

/**
 * Get internal context object.
 */
export const getContext = (context: CoreContext): CoreResult => {
	return {
		text: `Context: ${JSON.stringify(context, null, 2)}`,
		json: context,
		html: `<h1>Context</h1>\n<pre>${JSON.stringify(context, null, 2)}</pre>`
	};
};
