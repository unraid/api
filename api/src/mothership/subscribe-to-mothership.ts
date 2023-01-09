import { MOTHERSHIP_GRAPHQL_LINK } from '@app/consts';
import { logger, mothershipLogger } from '@app/core/log';
import { pubsub } from '@app/core/pubsub';
import { GraphQLClient, isAPIStateDataFullyLoaded } from './graphql-client';
import { addSubscription, mothership, removeSubscription, SubscriptionKey } from '@app/store/modules/minigraph';
import { getters, store } from '@app/store';
import { cacheServers } from '@app/store/modules/servers';
import { startDashboardProducer, stopDashboardProducer } from '@app/store/modules/dashboard';
import { GET_SERVERS_FROM_MOTHERSHIP } from '../graphql/mothership/queries';
import { EVENTS_SUBSCRIPTION } from '../graphql/mothership/subscriptions';
import { ClientType } from '@app/graphql/generated/client/graphql';
import { MinigraphStatus } from '@app/graphql/generated/api/types';

function notNull<T>(value: T): value is NonNullable<T> {
	return value !== null;
}

export const queryServers = async (apiKey: string) => {
	const client = GraphQLClient.getInstance();
	mothershipLogger.trace('Querying Servers');
	const queryResult = await client.query({ query: GET_SERVERS_FROM_MOTHERSHIP, variables: { apiKey }, fetchPolicy: 'network-only' });
	if (queryResult.data.servers) {
		const serversToSet = queryResult.data.servers.filter(notNull);
		mothershipLogger.addContext('result', serversToSet);
		mothershipLogger.trace('Got %s servers for user', serversToSet.length);
		mothershipLogger.removeContext('result');

		store.dispatch(cacheServers(serversToSet));
		if (serversToSet.length > 0) {
			// Publish owner event
			await pubsub.publish('owner', {
				owner: serversToSet[0].owner,
			});

			// Publish servers event
			await pubsub.publish('servers', {
				servers: serversToSet,
			});
		}
	}

	if (queryResult.errors) {
		mothershipLogger.error('Error querying servers: %s', queryResult.errors.join(','));
	}
};

export const subscribeToEvents = async (apiKey: string) => {
	const client = GraphQLClient.getInstance();
	store.dispatch(addSubscription(SubscriptionKey.EVENTS));
	const eventsSub = client.subscribe({ query: EVENTS_SUBSCRIPTION, variables: { apiKey } });
	eventsSub.subscribe(async ({ data, errors }) => {
		if (errors) {
			mothershipLogger.error('GraphQL Error with events subscription: %s', errors.join(','));
		} else if (data) {
			mothershipLogger.trace('Got events from mothership %o', data.events);
			for (const event of data.events?.filter(notNull) ?? []) {
				switch (event.__typename) {
					case 'ClientConnectedEvent': {
						const { connectedData: { type, apiKey: eventApiKey } } = event;
						// Another server connected to Mothership
						if (type === ClientType.API) {
							// eslint-disable-next-line no-await-in-loop
							await queryServers(apiKey);
						}

						// Dashboard Connected to Mothership
						if (type === ClientType.DASHBOARD && apiKey === eventApiKey) {
							store.dispatch(startDashboardProducer());
						}

						break;
					}

					case 'ClientDisconnectedEvent': {
						const { disconnectedData: { type, apiKey: eventApiKey } } = event;

						// Server Disconnected From Mothership
						if (type === ClientType.API) {
							// eslint-disable-next-line no-await-in-loop
							await queryServers(apiKey);
						}

						// The dashboard was closed or went idle
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
			mothershipLogger.info('Subscribe To Mothership - Querying servers');
			await queryServers(getters.config().remote.apikey);
			store.dispatch(addSubscription(SubscriptionKey.SERVERS));
		}
	} catch (error: unknown) {
		mothershipLogger.error('Failed to connect to %s', MOTHERSHIP_GRAPHQL_LINK.replace('http', 'ws'), error);
	}
};
