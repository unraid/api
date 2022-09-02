import WebSocket from 'ws';
import { MOTHERSHIP_GRAPHQL_LINK } from '@app/consts';
import { apiManager } from '@app/core/api-manager';
import { minigraphLogger } from '@app/core/log';
import { getRelayHeaders } from '@app/mothership/utils/get-relay-headers';
import { getters } from '@app/store';
import { Client, createClient, ExecutionResult, SubscribePayload } from 'graphql-ws';
import { bus } from '@app/core/bus';
import { v4 } from 'uuid';
import { GraphQLError } from 'graphql';

class WebsocketWithRelayHeaders extends WebSocket {
	constructor(address, protocols) {
		super(address, protocols, {
			headers: getRelayHeaders(),
		});
	}
}

type MinigraphStatus = 'CONNECTING' | 'CONNECTED' | 'ERROR' | 'DISCONNECTED' | 'RETRY_WAITING';
type SubscriptionKey = 'SERVERS';

interface MinigraphClientSubscription {
	subscription: () => void;
	subscriptionId: string;
	subscriptionKey: SubscriptionKey;
}

interface MinigraphClientState {
	status: MinigraphStatus;
	error: unknown;
	subscriptions: MinigraphClientSubscription[];
}

export class MinigraphClient {
	private static client: Client | null = null;
	private static clientState: MinigraphClientState = {
		status: 'DISCONNECTED',
		error: null,
		subscriptions: [],
	};

	private constructor() { }

	private static readonly setClientState = (newState: MinigraphStatus) => {
		bus.emit('minigraph-state', newState);
		MinigraphClient.clientState.status = newState;
	};

	private static readonly clearClient = async () => {
		await MinigraphClient.client?.dispose();
		MinigraphClient.client = null;
		MinigraphClient.clientState = {
			status: 'DISCONNECTED',
			error: null,
			subscriptions: [],
		};
	};

	private static readonly createClient = () => {
		const client = createClient({
			url: MOTHERSHIP_GRAPHQL_LINK.replace('http', 'ws'),
			webSocketImpl: WebsocketWithRelayHeaders,
			connectionParams: () => ({
				apiVersion: getters.config().version,
				apiKey: apiManager.cloudKey,
			}),
			shouldRetry() {
				return true;
			},
			retryAttempts: Infinity,
		});
		client.on('connecting', () => {
			MinigraphClient.setClientState('CONNECTING');
			minigraphLogger.info('Connecting to %s', MOTHERSHIP_GRAPHQL_LINK.replace('http', 'ws'));
		});
		client.on('connected', () => {
			MinigraphClient.setClientState('CONNECTED');
			minigraphLogger.info('Connected to %s', MOTHERSHIP_GRAPHQL_LINK.replace('http', 'ws'));
		});
		client.on('error', error => {
			MinigraphClient.setClientState('ERROR');
			minigraphLogger.error('Error in MinigraphClient', error);
		});
		client.on('closed', () => {
			MinigraphClient.setClientState('DISCONNECTED');
			minigraphLogger.debug('MinigraphClient closed connection');
		});
		client.on('message', message => {
			minigraphLogger.trace('Message from Minigraph:', message);
		});
		return client;
	};

	public static getClient(): Client {
		if (!MinigraphClient.client) {
			MinigraphClient.client = MinigraphClient.createClient();
		}

		return MinigraphClient.client;
	}

	public static query = async (query: SubscribePayload): Promise<any> => new Promise((resolve, reject) => {
		let result: ExecutionResult<Record<string, unknown>, unknown>;
		MinigraphClient.getClient().subscribe(
			query,
			{
				next(data) {
					result = data;
				},
				error: reject,
				complete() {
					resolve(result);
				},
			},
		);
	});

	private static readonly removeSubscriptionById = (subscriptionId: string): boolean => {
		let result = true;
		const newSubscriptions = MinigraphClient.clientState.subscriptions
			.filter(subscriptions => subscriptions.subscriptionId !== subscriptionId);
		if (newSubscriptions.length === MinigraphClient.clientState.subscriptions.length) {
			result = false;
			minigraphLogger.error('Failed to remove subscription with ID: %s', subscriptionId);
		}

		MinigraphClient.clientState.subscriptions = newSubscriptions;
		return result;
	};

	public static subscribe = ({
		subscriptionKey,
		query,
		nextFn,
	}: {
		subscriptionKey: SubscriptionKey;
		query: SubscribePayload;
		nextFn: (value: ExecutionResult<any, unknown>) => void;
	}) => {
		const subscriptionId = v4();
		const subscription = MinigraphClient.getClient().subscribe(
			query,
			{
				next: nextFn,
				error(anyError: Error | readonly GraphQLError[] | CloseEvent) {
					minigraphLogger.error('Encountered a Subscription Error', anyError);
					MinigraphClient.removeSubscriptionById(subscriptionId);
				},
				complete() {
					minigraphLogger.debug(`Subscription with ID: ${subscriptionId} complete, removing from tracked subscriptions`);
					MinigraphClient.removeSubscriptionById(subscriptionId);
				},
			},
		);
		MinigraphClient.clientState.subscriptions.push({ subscriptionId, subscriptionKey, subscription });
		minigraphLogger.trace('Current Subscriptions:', MinigraphClient.clientState.subscriptions);
	};

	public static isKeySubscribed = (subscriptionKey: string): boolean => MinigraphClient.clientState.subscriptions.some(subscription => subscription.subscriptionKey === subscriptionKey);
}
