import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client/core';
import { INTERNAL_WS_LINK } from '@app/consts';

import { fetch } from 'cross-fetch';

export const getApiApolloClient = ({ upcApiKey }: { upcApiKey: string }) => new ApolloClient({
	defaultOptions: {
		query: {
			fetchPolicy: 'no-cache'
		},
		mutate: {
			fetchPolicy: 'no-cache'
		}
	},
	cache: new InMemoryCache(),
	link: new HttpLink({
		uri: INTERNAL_WS_LINK,
		fetch,
		headers: {
			Origin: '/var/run/unraid-cli.sock',
			'x-api-key': upcApiKey,
			'Content-Type': 'application/json',
		},
	}),
});
