import nodeFetch from 'node-fetch';
import fetchRetryable from 'fetch-retryable';

export const fetch = (url: string, options: Record<string, any> = {}) => fetchRetryable(url, {
	fetch: nodeFetch,
	...options
});
