import WebSocket from 'ws';
import { MOTHERSHIP_GRAPHQL_LINK } from '@app/consts';
import { minigraphLogger } from '@app/core/log';
import { getRelayHeaders } from '@app/mothership/utils/get-relay-headers';
import { getters, store } from '@app/store';
import { createClient, ExecutionResult, SubscribePayload } from 'graphql-ws';
import { v4 } from 'uuid';
import { GraphQLError } from 'graphql';
import { addSubscription, getNewMinigraphClient, MinigraphStatus, removeSubscriptionById, setStatus, SubscriptionKey } from '@app/store/modules/minigraph';
import { clearAllServers } from '@app/store/modules/servers';

class WebsocketWithRelayHeaders extends WebSocket {
	constructor(address, protocols) {
		super(address, protocols, {
			headers: getRelayHeaders(),
		});
	}
}

export const createMinigraphClient = () => {
	const config = getters.config();
	const emhttp = getters.emhttp();
	const client = createClient({
		url: MOTHERSHIP_GRAPHQL_LINK.replace('http', 'ws'),
		webSocketImpl: WebsocketWithRelayHeaders,
		connectionParams: () => ({
			apiVersion: config.api.version,
			apiKey: config.remote.apikey,
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
		minigraphLogger.debug('MinigraphClient closed connection', event);
	});
	client.on('message', message => {
		minigraphLogger.trace('Message from Minigraph: %o', message);
	});
	return client;
};

export const MinigraphClient = {
	// eslint-disable-next-line no-async-promise-executor
	query: async (query: SubscribePayload): Promise<ExecutionResult<Record<string, unknown>, unknown>> => new Promise(async (resolve, reject) => {
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
					minigraphLogger.trace('Finished a query %s', query);
					resolve(result);
				},
			},
		);
	}),
	async subscribe({
		subscriptionKey,
		query,
		nextFn,
	}: {
		subscriptionKey: SubscriptionKey;
		query: SubscribePayload;
		nextFn: (value: ExecutionResult<any, unknown>) => void;
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
		minigraphLogger.trace('Current Subscriptions: %o', getters.minigraph().subscriptions);
	},
};
