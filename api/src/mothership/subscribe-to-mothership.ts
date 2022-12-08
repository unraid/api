import { MOTHERSHIP_GRAPHQL_LINK } from '@app/consts';
import { ExecutionResult } from 'graphql';
import { mothershipLogger } from '@app/core/log';
import { pubsub } from '@app/core/pubsub';
import { GraphqlClient } from './graphql-client';
import { isKeySubscribed, MinigraphStatus, SubscriptionKey } from '@app/store/modules/minigraph';
import { getters, store } from '@app/store';
import { cacheServers, Server } from '@app/store/modules/servers';
import { startDashboardProducer, stopDashboardProducer } from '@app/store/modules/dashboard';
import { gql } from 'graphql-tag';

type ServersExecutionResult = ExecutionResult<{ servers: Server[] }>;

export const subscribeToServers = async (apiKey: string) => {
	const query = {
		query: `subscription servers ($apiKey: String!) {
            servers @auth(apiKey: $apiKey)
        }`,
		variables: {
			apiKey,
		},
	};

	const nextFn = async ({ data, errors }: ServersExecutionResult) => {
		if (errors && errors.length > 0) {
			mothershipLogger.error('Failed subscribing to %s', MOTHERSHIP_GRAPHQL_LINK);
			errors.forEach(error => {
				mothershipLogger.error(error);
			});
			return;
		}

		if (data) {
			mothershipLogger.trace('Received subscription data for servers %o', data.servers);

			// Update servers cache
			store.dispatch(cacheServers(data.servers));

			// Publish owner event
			await pubsub.publish('owner', {
				owner: data?.servers?.[0]?.owner,
			});

			// Publish servers event
			await pubsub.publish('servers', {
				servers: data.servers,
			});
		} else {
			mothershipLogger.debug('Failed to get subscription data for servers');
		}
	};

	await GraphqlClient.subscribe<ServersExecutionResult>({ query, nextFn, subscriptionKey: SubscriptionKey.SERVERS });
};

type Event = {
	type: 'CLIENT_CONNECTED' | 'CLIENT_DISCONNECTED';
	data: {
		type: 'dashboard';
		dashboardVersion: string;
	} | {
		type: 'API';
		flashGuid: string;
		apiVersion: string;
	};
} | {
	type: 'GRAPHQL_QUERY' | 'GRAPHQL_MUTATION';
	data: {
		id: string | number;
		query: string;
		variables: Record<string, string | number | boolean>;
	};
};

type EventsExecutionResult = ExecutionResult<{ events: Event[] }>;

export const subscribeToEvents = async (apiKey: string) => {
	const query = {
		query: gql`
			subscription events($apiKey: String!) {
				events @auth(apiKey: $apiKey) {
					type
					data
				}
			}
		`.loc!.source.body,
		variables: { apiKey },
	};

	const nextFn = async ({ data, errors }: EventsExecutionResult) => {
		try {
			if (errors && errors.length > 0) {
				mothershipLogger.error('Failed subscribing to %s', MOTHERSHIP_GRAPHQL_LINK);
				errors.forEach(error => {
					mothershipLogger.error(error);
				});
				return;
			}

			if (!data) {
				mothershipLogger.debug('Failed to get event data');
				return;
			}

			mothershipLogger.trace('Received new events from mothership %s', JSON.stringify(data));
			for (const event of data.events) {
				switch (event.type) {
					case 'CLIENT_CONNECTED':
						// Another server connected to mothership
						if (event.data.type === 'API') {
							// This could trigger a fetch for more server data?

							// Another server connected with this flashGUID?
							// TODO: maybe we should disconnect at this point?
							if (event.data.flashGuid === getters.emhttp().var.flashGuid) return;
						}

						// Someone opened the dashboard
						if (event.data.type === 'dashboard') {
							store.dispatch(startDashboardProducer());
						}

						break;
					case 'CLIENT_DISCONNECTED':
						// The dashboard was closed or went idle
						if (event.data.type === 'dashboard') {
							store.dispatch(stopDashboardProducer());
						}

						break;
					default:
						break;
				}
			}
		} catch (error: unknown) {
			mothershipLogger.error('Failed processing events from mothership', error);
		}
	};

	await GraphqlClient.subscribe<EventsExecutionResult>({ query, nextFn, subscriptionKey: SubscriptionKey.SERVERS });
};

export const subscribeToMothership = async () => {
	try {
		// Bail if we're in the middle of opening a connection
		if (getters.minigraph().status === MinigraphStatus.CONNECTING) {
			mothershipLogger.debug('Bailing on trying to fix mothership connection, currently connecting');
			return;
		}

		// Check if we're already subscribed
		const isSubscribedToServers = await isKeySubscribed(SubscriptionKey.SERVERS);

		// If they're not subbed and don't have a key skip this
		if (!isSubscribedToServers && !getters.config().remote.apikey) return;

		// If we're already subbed skip this
		if (isSubscribedToServers) return;

		// If we have a key and aren't subbed, start the subs
		mothershipLogger.debug('Subscribing to mothership');

		// Subscribe to "events"
		await subscribeToEvents(getters.config().remote.apikey);
	} catch (error: unknown) {
		mothershipLogger.error('Failed to connect to %s', MOTHERSHIP_GRAPHQL_LINK.replace('http', 'ws'), error);
	}
};
