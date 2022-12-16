import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client/core';
import fetch from 'cross-fetch';

export const getApiApolloClient = ({ upcApiKey }: { upcApiKey: string }) => new ApolloClient({
	cache: new InMemoryCache(),
	link: new HttpLink({
		uri: process.env.PORT ? `http://localhost:${process.env.PORT}/graphql` : 'http://unix:/var/run/unraid-api.sock:/graphql',
		fetch,
		headers: {
			Origin: '/var/run/unraid-cli.sock',
			'x-api-key': upcApiKey,
			'Content-Type': 'application/json',
		},
	}),
});
