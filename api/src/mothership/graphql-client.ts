import WebSocket from 'ws';
import { MOTHERSHIP_GRAPHQL_LINK } from '@app/consts';
import { minigraphLogger } from '@app/core/log';
import { getMothershipWebsocketHeaders } from '@app/mothership/utils/get-mothership-websocket-headers';
import { getters, store } from '@app/store';
import { createClient } from 'graphql-ws';
import { setStatus } from '@app/store/modules/minigraph';
import { ApolloClient, InMemoryCache, type NormalizedCacheObject } from '@apollo/client/core';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { MinigraphStatus } from '@app/graphql/generated/api/types';

class WebsocketWithMothershipHeaders extends WebSocket {
	constructor(address, protocols) {
		super(address, protocols, {
			headers: getMothershipWebsocketHeaders(),
		});
	}
}

/**
 * Checks that config.api.version, config.remote.apiKey, emhttp.var.flashGuid, and emhttp.var.version
 * are all set before returning true
 * @returns boolean, are variables set
 */
export const isAPIStateDataFullyLoaded = () => {
	const config = getters.config();
	const emhttp = getters.emhttp();
	return Boolean(config.api.version) && Boolean(config.remote.apikey) && Boolean(emhttp.var.flashGuid) && Boolean(emhttp.var.version);
};

export const createGraphqlClient = () => {
	const config = getters.config();
	const emhttp = getters.emhttp();
	const client = createClient({
		url: MOTHERSHIP_GRAPHQL_LINK.replace('http', 'ws'),
		webSocketImpl: WebsocketWithMothershipHeaders,
		connectionParams: () => ({
			clientType: 'API',
			apiVersion: config.api.version,
			apiKey: config.remote.apikey,
			flashGuid: emhttp.var.flashGuid,
			unraidVersion: emhttp.var.version,
		}),
		shouldRetry() {
			return true;
		},
		lazy: false,
		retryAttempts: Infinity,
		onNonLazyError: async (error) => {
			minigraphLogger.error('Non-Lazy Error %o', error)
		}
	});
	const wsLink = new GraphQLWsLink(client);
	const apolloClient = new ApolloClient({
		uri: MOTHERSHIP_GRAPHQL_LINK,
		link: wsLink,
		cache: new InMemoryCache(),
		defaultOptions: {
			watchQuery: {
				fetchPolicy: 'no-cache',
				errorPolicy: 'ignore',
			  },
			  query: {
				fetchPolicy: 'no-cache',
				errorPolicy: 'all',
			},
		}
	});
	// Maybe a listener to initiate this
	client.on('connecting', () => {
		store.dispatch(setStatus({ status: MinigraphStatus.CONNECTING, error: null }));
		minigraphLogger.info('Connecting to %s', MOTHERSHIP_GRAPHQL_LINK.replace('http', 'ws'));
	});
	client.on('connected', () => {
		store.dispatch(setStatus({ status: MinigraphStatus.CONNECTED, error: null }));
		minigraphLogger.info('Connected to %s', MOTHERSHIP_GRAPHQL_LINK.replace('http', 'ws'));
	});
	client.on('error', error => {
		const normalError = (error instanceof Error) ? error : new Error('Unknown Minigraph Client Error');
		store.dispatch(setStatus({ status: MinigraphStatus.ERROR, error: normalError?.message ?? 'Unknown Minigraph Client Error' }));
		minigraphLogger.error('Error in MinigraphClient', error);
	});
	client.on('closed', event => {
		store.dispatch(setStatus({ status: MinigraphStatus.DISCONNECTED, error: 'Client Closed Connection' }));
		// Store.dispatch(clearAllServers());
		minigraphLogger.addContext('closeEvent', event);
		minigraphLogger.debug('MinigraphClient closed connection', event);
		minigraphLogger.removeContext('closeEvent');
	});
	return apolloClient;
};

export const graphQLClient: ReturnType<typeof createGraphqlClient> | null = null;

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class GraphQLClient {
	public static instance: ApolloClient<NormalizedCacheObject> | null = null;
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	private constructor() {}

	public static getInstance(): ApolloClient<NormalizedCacheObject> {
		// @TODO: Should this check to make sure it's able to get a valid instance before it returns Apollo?
		if (!GraphQLClient.instance) {
			GraphQLClient.instance = createGraphqlClient();
		}

		return GraphQLClient.instance;
	}
}
