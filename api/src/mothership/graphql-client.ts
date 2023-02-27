import WebSocket from 'ws';
import { FIVE_MINUTES_MS, KEEP_ALIVE_INTERVAL_MS, MAX_RETRIES_FOR_LINEAR_BACKOFF, MOTHERSHIP_GRAPHQL_LINK, ONE_MINUTE_MS } from '@app/consts';
import { minigraphLogger } from '@app/core/log';
import { getMothershipWebsocketHeaders } from '@app/mothership/utils/get-mothership-websocket-headers';
import { getters, store } from '@app/store';
import { type Client, createClient } from 'graphql-ws';
import { setGraphqlConnectionStatus } from '@app/store/actions/set-minigraph-status';
import { ApolloClient, InMemoryCache, type NormalizedCacheObject } from '@apollo/client/core';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { MinigraphStatus } from '@app/graphql/generated/api/types';
import { API_VERSION } from '@app/environment';
import { sleep } from '@app/core/utils/misc/sleep';
import { setMothershipTimeout } from '@app/store/modules/minigraph';
import { logoutUser } from '@app/store/modules/config';
import { serializeError } from 'serialize-error';
import { isApiKeyValid } from '@app/store/getters/index';

class WebsocketWithMothershipHeaders extends WebSocket {
	constructor(address, protocols) {
		super(address, protocols, {
			headers: getMothershipWebsocketHeaders(),
		});
	}
}

/**
 * Checks that API_VERSION, config.remote.apiKey, emhttp.var.flashGuid, and emhttp.var.version are all set before returning true\
 * Also checks that the API Key has passed Validation from Keyserver
 * @returns boolean, are variables set
 */
export const isAPIStateDataFullyLoaded = (state = store.getState()) => {
	const { config, emhttp } = state;
	return Boolean(API_VERSION) && Boolean(config.remote.apikey) && Boolean(emhttp.var.flashGuid) && Boolean(emhttp.var.version);
};

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class GraphQLClient {
	public static instance: ApolloClient<NormalizedCacheObject> | null = null;
	public static client: Client | null = null;
	public static pingAlarmTimeout: NodeJS.Timeout | null = null;
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	private constructor() {}

	/**
	 * Get a singleton GraphQL instance (if possible given loaded state)
	 * @returns ApolloClient instance or null, if state is not valid
	 */
	public static getInstance(): ApolloClient<NormalizedCacheObject> | null {
		const isStateValid = isAPIStateDataFullyLoaded() && isApiKeyValid();
		if (!isStateValid) {
			minigraphLogger.error('GraphQL Client is not valid. Returning null for instance and clearing existing instance');
			this.clearInstance();
			return null;
		}

		return GraphQLClient.instance;
	}

	/**
	 * This function is used to create a new Apollo instance (if it is possible to do so)
	 * This is used in order to facilitate a single instance existing at a time
	 * @returns Apollo Instance (if creation was possible)
	 */
	public static createSingletonInstance = () => {
		const isStateValid = isAPIStateDataFullyLoaded() && isApiKeyValid();

		if (!GraphQLClient.instance && isStateValid) {
			GraphQLClient.instance = GraphQLClient.createGraphqlClient();
		}

		return GraphQLClient.instance;
	};

	public static clearInstance = () => {
		if (GraphQLClient.client) {
			void GraphQLClient.client.dispose();
			GraphQLClient.client = null;
		}

		if (this.instance) {
			this.instance?.stop();
		}

		GraphQLClient.instance = null;
		GraphQLClient.pingAlarmTimeout = null;
	};

	static createGraphqlClient() {
		const config = getters.config();
		const emhttp = getters.emhttp();
		GraphQLClient.client = createClient({
			url: MOTHERSHIP_GRAPHQL_LINK.replace('http', 'ws'),
			webSocketImpl: WebsocketWithMothershipHeaders,
			connectionParams: () => ({
				clientType: 'API',
				apiVersion: API_VERSION,
				apiKey: config.remote.apikey,
				flashGuid: emhttp.var.flashGuid,
				unraidVersion: emhttp.var.version,
			}),
			shouldRetry() {
				return true;
			},
			lazy: false,
			async retryWait(retries) {
				const retryTime = retries > MAX_RETRIES_FOR_LINEAR_BACKOFF ? FIVE_MINUTES_MS : (5_000 * retries) + 10_000;
				store.dispatch(setMothershipTimeout(retryTime));
				minigraphLogger.info(`Retry wait is currently : ${retryTime}`);
				await (sleep(retryTime));
			},
			retryAttempts: Infinity,
			async onNonLazyError(error) {
				store.dispatch(setGraphqlConnectionStatus({ status: MinigraphStatus.ERROR, error: error instanceof Error ? error.message : error?.toString() ?? 'N/A' }));
				minigraphLogger.error('NonLazy Error in MinigraphClient', error instanceof Error ? error.message : error);
			},
		});
		const wsLink = new GraphQLWsLink(GraphQLClient.client);
		const apolloClient = new ApolloClient({
			uri: MOTHERSHIP_GRAPHQL_LINK,
			link: wsLink,
			cache: new InMemoryCache(),
			defaultOptions: {
				watchQuery: {
					fetchPolicy: 'no-cache',
					errorPolicy: 'all',
				},
				query: {
					fetchPolicy: 'no-cache',
					errorPolicy: 'all',
				},
			},
		});
		// Maybe a listener to initiate this
		GraphQLClient.client.on('connecting', () => {
			store.dispatch(setGraphqlConnectionStatus({ status: MinigraphStatus.CONNECTING, error: null }));
			minigraphLogger.info('Connecting to %s', MOTHERSHIP_GRAPHQL_LINK.replace('http', 'ws'));
		});
		GraphQLClient.client.on('connected', () => {
			store.dispatch(setGraphqlConnectionStatus({ status: MinigraphStatus.CONNECTED, error: null }));
			minigraphLogger.info('Connected to %s', MOTHERSHIP_GRAPHQL_LINK.replace('http', 'ws'));
		});
		GraphQLClient.client.on('error', async error => {
			const normalError = (error instanceof Error) ? error : new Error('Unknown Minigraph Client Error');
			if (error instanceof Error && error.message.includes('API Key Invalid')) {
				await store.dispatch(logoutUser({ reason: 'Invalid API Key on Mothership' }));
			} else {
				store.dispatch(setGraphqlConnectionStatus({ status: MinigraphStatus.ERROR, error: normalError?.message ?? 'Unknown Minigraph Client Error' }));
				minigraphLogger.error(`Error in MinigraphClient ${JSON.stringify(serializeError(error))}`);
			}
		});
		GraphQLClient.client.on('closed', event => {
			store.dispatch(setGraphqlConnectionStatus({ status: MinigraphStatus.ERROR, error: 'Client Closed Connection' }));
			minigraphLogger.addContext('closeEvent', event);
			minigraphLogger.debug('MinigraphClient closed connection');
			minigraphLogger.removeContext('closeEvent');
		});

		GraphQLClient.client.on('ping', () => {
			// Received ping from mothership
			if (GraphQLClient.pingAlarmTimeout) {
				clearTimeout(GraphQLClient.pingAlarmTimeout);
				GraphQLClient.pingAlarmTimeout = null;
			}

			minigraphLogger.trace('ping');
			GraphQLClient.pingAlarmTimeout = setTimeout(() => {
				if (getters.minigraph().status === MinigraphStatus.CONNECTED) {
					minigraphLogger.error(`NO PINGS RECEIVED IN ${KEEP_ALIVE_INTERVAL_MS / 1_000}, SOCKET MUST BE RECONNECTED`);
					store.dispatch(setGraphqlConnectionStatus({ status: MinigraphStatus.DISCONNECTED, error: 'Ping Receive Exceeded Timeout' }));
				}
			}, KEEP_ALIVE_INTERVAL_MS);
		});
		return apolloClient;
	}
}
