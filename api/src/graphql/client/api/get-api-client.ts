import { ApolloClient, HttpLink, InMemoryCache, split } from '@apollo/client/core';
import { INTERNAL_HTTP_LINK, INTERNAL_WS_LINK } from '@app/consts';
import { WebSocketLink } from '@apollo/client/link/ws';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import WebSocket from 'ws';
import { fetch } from 'cross-fetch';
import { getMainDefinition } from '@apollo/client/utilities';

class WebsocketWithOriginHeader extends WebSocket {
    constructor(address, protocols) {
        super(address, protocols, {
            headers: {
                Origin: '/var/run/unraid-cli.sock',
                'Content-Type': 'application/json',
            },
        });
    }
}


export const getApiApolloClient = ({ upcApiKey }: { upcApiKey: string }) => {

	
	const httpLink = new HttpLink({
		uri: INTERNAL_HTTP_LINK,
		fetch,
		headers: {
			Origin: '/var/run/unraid-cli.sock',
			'x-api-key': upcApiKey,
			'Content-Type': 'application/json',
		},
	})
	const wsLink = new WebSocketLink(new SubscriptionClient(INTERNAL_WS_LINK, {
		reconnect: true,
		connectionParams: {
			'x-api-key': upcApiKey
		}
	}, WebsocketWithOriginHeader))

	const splitLink = split(
		({ query }) => {
			const definition = getMainDefinition(query);
			return (
				definition.kind === 'OperationDefinition' &&
				definition.operation === 'subscription'
			);
		},
		wsLink,
		httpLink
	);

	return new ApolloClient({
	defaultOptions: {
		query: {
			fetchPolicy: 'no-cache'
		},
		mutate: {
			fetchPolicy: 'no-cache'
		}
	},
	cache: new InMemoryCache(),
	link: splitLink
	});
}