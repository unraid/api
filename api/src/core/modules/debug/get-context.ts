import { type CoreContext, type CoreResult } from '@app/core/types';

/**
 * Get internal context object.
 */
export const getContext = (context: CoreContext): CoreResult => ({
	text: `Context: ${JSON.stringify(context, null, 2)}`,
	json: context,
	html: `<h1>Context</h1>\n<pre>${JSON.stringify(context, null, 2)}</pre>`,
});
