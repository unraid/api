import { MOTHERSHIP_GRAPHQL_LINK } from '@app/consts';
import { type ExecutionResult, print } from 'graphql';
import { mothershipLogger } from '@app/core/log';
import { pubsub } from '@app/core/pubsub';
import { GraphqlClient } from './graphql-client';
import { isKeySubscribed, MinigraphStatus, SubscriptionKey } from '@app/store/modules/minigraph';
import { getters, store } from '@app/store';
import { cacheServers, type Server } from '@app/store/modules/servers';
import { startDashboardProducer, stopDashboardProducer } from '@app/store/modules/dashboard';
import { eventsDocument, type eventsSubscription, ClientType, serversDocument } from '@app/graphql/generated/types';

type ServersExecutionResult = ExecutionResult<{ servers: Server[] }>;

export const subscribeToServers = async (apiKey: string) => {
	const query = {
		query: print(serversDocument),
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

type EventsExecutionResult = ExecutionResult<{ events: eventsSubscription['events'] }>;

export const subscribeToEvents = async (apiKey: string) => {
	const query = {
		query: print(eventsDocument),
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
			if (!data.events) {
				return;
			}

			for (const event of data.events.filter(event => event)) {
				switch (event?.__typename) {
					case 'ClientConnectedEvent': {
						// Another server connected to mothership
						const { connectedData: { type, apiKey: eventApiKey } } = event;

						if (type === ClientType.API) {
							// This could trigger a fetch for more server data?

							// Another server connected with this flashGUID?
							// TODO: maybe we should disconnect at this point?
							// if (event.connectedData.flashGuid === getters.emhttp().var.flashGuid) return;
						}

						// Someone opened the dashboard
						if (type === ClientType.DASHBOARD && apiKey === eventApiKey) {
							store.dispatch(startDashboardProducer());
						}

						break;
					}

					case 'ClientDisconnectedEvent': {
						// The dashboard was closed or went idle
						const { disconnectedData: { type, apiKey: eventApiKey } } = event;

						if (type === ClientType.DASHBOARD && apiKey === eventApiKey) {
							store.dispatch(stopDashboardProducer());
						}

						break;
					}

					default:
						break;
				}
			}
		} catch (error: unknown) {
			mothershipLogger.error('Failed processing events from mothership', error);
		}
	};

	await GraphqlClient.subscribe<EventsExecutionResult>({ query, nextFn, subscriptionKey: SubscriptionKey.EVENTS });
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
		await subscribeToServers(getters.config().remote.apikey);
	} catch (error: unknown) {
		mothershipLogger.error('Failed to connect to %s', MOTHERSHIP_GRAPHQL_LINK.replace('http', 'ws'), error);
	}
};
