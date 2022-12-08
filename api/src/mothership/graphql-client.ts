import WebSocket from 'ws';
import { MOTHERSHIP_GRAPHQL_LINK } from '@app/consts';
import { minigraphLogger } from '@app/core/log';
import { getMothershipWebsocketHeaders } from '@app/mothership/utils/get-mothership-websocket-headers';
import { getters, store } from '@app/store';
import { createClient, type ExecutionResult, type SubscribePayload } from 'graphql-ws';
import { v4 } from 'uuid';
import { type GraphQLError } from 'graphql';
import { addSubscription, getNewMinigraphClient, MinigraphStatus, removeSubscriptionById, setStatus, type SubscriptionKey } from '@app/store/modules/minigraph';
import { clearAllServers } from '@app/store/modules/servers';

class WebsocketWithMothershipHeaders extends WebSocket {
	constructor(address, protocols) {
		super(address, protocols, {
			headers: getMothershipWebsocketHeaders(),
		});
	}
}

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
		retryAttempts: Infinity,
	});
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
		store.dispatch(setStatus({ status: MinigraphStatus.ERROR, error: { message: normalError?.message ?? 'no message' } }));
		minigraphLogger.error('Error in MinigraphClient', error);
	});
	client.on('closed', event => {
		store.dispatch(setStatus({ status: MinigraphStatus.DISCONNECTED, error: null }));
		store.dispatch(clearAllServers());
		minigraphLogger.addContext('closeEvent', event);
		minigraphLogger.debug('MinigraphClient closed connection');
		minigraphLogger.removeContext('closeEvent');
	});
	client.on('message', message => {
		minigraphLogger.addContext('message', message);
		minigraphLogger.trace('Message from Minigraph');
		minigraphLogger.removeContext('message');
	});
	return client;
};

export const GraphqlClient = {
	// eslint-disable-next-line no-async-promise-executor
	query: async <T extends ExecutionResult>(query: SubscribePayload): Promise<T> => new Promise(async (resolve, reject) => {
		let result: ExecutionResult<Record<string, unknown>, unknown>;

		const client = getters.minigraph().client ?? await getNewMinigraphClient();
		client?.subscribe(
			query,
			{
				next(data) {
					result = data;
				},
				error: reject,
				complete() {
					minigraphLogger.addContext('query', query);
					minigraphLogger.trace('Finished a query');
					minigraphLogger.removeContext('query');
					resolve(result as T);
				},
			},
		);
	}),
	async subscribe<T extends ExecutionResult>({
		subscriptionKey,
		query,
		nextFn,
	}: {
		subscriptionKey: SubscriptionKey;
		query: SubscribePayload;
		nextFn: (value: T) => void;
	}) {
		const subscriptionId = v4();
		if (!getters.config().remote.apikey) {
			throw new Error('missing api key, did not subscribe');
		}

		const client = getters.minigraph().client ?? await getNewMinigraphClient();
		if (!client) throw new Error('Failed to create a mini-graphql client');
		const subscription = client?.subscribe(query, {
			next: nextFn,
			error(anyError: Error | readonly GraphQLError[] | CloseEvent) {
				minigraphLogger.error('Encountered a Subscription Error', anyError);
				store.dispatch(removeSubscriptionById(subscriptionId));
			},
			complete() {
				minigraphLogger.debug(`Subscription with ID: ${subscriptionId} complete, removing from tracked subscriptions`);
				store.dispatch(removeSubscriptionById(subscriptionId));
			},
		});
		store.dispatch(addSubscription({ subscriptionId, subscriptionKey, subscription }));
		minigraphLogger.addContext('subscriptions', getters.minigraph().subscriptions);
		minigraphLogger.trace('Current Subscriptions: %i', getters.minigraph().subscriptions.length);
		minigraphLogger.removeContext('subscriptions');
	},
};
