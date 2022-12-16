import { ApolloClient, InMemoryCache } from '@apollo/client';

export const getApiApolloClient = ({ upcApiKey }: { upcApiKey: string }) => new ApolloClient({
	uri: 'http://unix:/var/run/unraid-api.sock:/graphql',
	headers: {
		Origin: '/var/run/unraid-cli.sock',
		'Content-Type': 'application/json',
		'x-api-key': upcApiKey,
	},
	cache: new InMemoryCache(),
});
