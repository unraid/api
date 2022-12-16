import { MOTHERSHIP_GRAPHQL_LINK } from '@app/consts';
import { mothershipLogger } from '@app/core/log';
import { pubsub } from '@app/core/pubsub';
import { GraphQLClient, isAPIStateDataFullyLoaded } from './graphql-client';
import { addSubscription, removeSubscription, SubscriptionKey } from '@app/store/modules/minigraph';
import { getters, store } from '@app/store';
import { cacheServers } from '@app/store/modules/servers';
import { startDashboardProducer, stopDashboardProducer } from '@app/store/modules/dashboard';
import { GET_SERVERS_FROM_MOTHERSHIP } from '../graphql/mothership/queries';
import { EVENTS_SUBSCRIPTION, SERVERS_SUBSCRIPTION } from '../graphql/mothership/subscriptions';
import { ClientType } from '@app/graphql/generated/client/graphql';
import { MinigraphStatus } from '@app/graphql/generated/api/types';

function notNull<T>(value: T): value is NonNullable<T> {
	return value !== null;
}

export const queryAndSubscribeToServers = async (apiKey: string) => {
	const client = GraphQLClient.getInstance();
	const queryResult = await client.query({ query: GET_SERVERS_FROM_MOTHERSHIP, variables: { apiKey } });
	if (queryResult.data.servers) {
		const serversToSet = queryResult.data.servers.filter(notNull);
		store.dispatch(cacheServers(serversToSet));
	}

	if (queryResult.errors) {
		mothershipLogger.error('Error querying servers: %s', queryResult.errors.join(','));
	}

	const serversub = client.subscribe({ query: SERVERS_SUBSCRIPTION, variables: { apiKey } });
	store.dispatch(addSubscription(SubscriptionKey.SERVERS));
	serversub.subscribe(async ({ data, errors }) => {
		mothershipLogger.trace('Received subscription data for servers %o', data?.servers);
		if (errors) {
			mothershipLogger.error('Error with servers subscription: %s', errors.join(','));
			// @TODO: Types for this payload
		} else if (data?.servers) {
			const serversToSet = data.servers.filter(notNull);
			store.dispatch(cacheServers(serversToSet));

			// Publish owner event
			await pubsub.publish('owner', {
				owner: data?.servers?.[0]?.owner,
			});

			// Publish servers event
			await pubsub.publish('servers', {
				servers: data.servers,
			});
		}
	}, (err: unknown) => {
		mothershipLogger.error('Error in subscription %o', err);
	}, () => {
		store.dispatch(removeSubscription(SubscriptionKey.SERVERS));
	});
};

export const subscribeToEvents = async (apiKey: string) => {
	const client = GraphQLClient.getInstance();
	store.dispatch(addSubscription(SubscriptionKey.EVENTS));
	const eventsSub = client.subscribe({ query: EVENTS_SUBSCRIPTION, variables: { apiKey } });
	eventsSub.subscribe(async ({ data, errors }) => {
		if (errors) {
			mothershipLogger.error('GraphQL Error with events subscription: %s', errors.join(','));
		} else if (data?.events) {
			for (const event of data.events.filter(notNull)) {
				switch (event.__typename) {
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
		}
	}, err => {
		mothershipLogger.error('Error in events subscription %o', err);
	}, () => {
		store.dispatch(removeSubscription(SubscriptionKey.EVENTS));
	});
};

export const subscribeToMothership = async () => {
	try {
		if (!isAPIStateDataFullyLoaded()) {
			mothershipLogger.warn('Waiting for state to initialize');
			return;
		}

		// Bail if we're in the middle of opening a connection
		if (getters.minigraph().status === MinigraphStatus.CONNECTING) {
			mothershipLogger.debug('Bailing on trying to fix mothership connection, currently connecting');
			return;
		}

		const isSubscribedToEvents = getters.minigraph().subscriptions[SubscriptionKey.EVENTS];

		if (!isSubscribedToEvents) {
			mothershipLogger.info('Subscribing to Events');
			await subscribeToEvents(getters.config().remote.apikey);
		}

		// Check if we're already subscribed
		const isSubscribedToServers = getters.minigraph().subscriptions[SubscriptionKey.SERVERS];

		if (!isSubscribedToServers) {
			mothershipLogger.info('Querying and Subscribing to Servers');
			await queryAndSubscribeToServers(getters.config().remote.apikey);
		}
	} catch (error: unknown) {
		mothershipLogger.error('Failed to connect to %s', MOTHERSHIP_GRAPHQL_LINK.replace('http', 'ws'), error);
	}
};
