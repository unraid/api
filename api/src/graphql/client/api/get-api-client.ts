import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client/core';
import { fetch } from 'cross-fetch';

export const getApiApolloClient = ({ upcApiKey }: { upcApiKey: string }) => new ApolloClient({
	cache: new InMemoryCache(),
	link: new HttpLink({
		uri: 'http://localhost/graphql',
		fetch,
		headers: {
			Origin: '/var/run/unraid-cli.sock',
			'x-api-key': upcApiKey,
			'Content-Type': 'application/json',
		},
	}),
});
