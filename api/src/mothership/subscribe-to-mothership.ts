/* eslint-disable max-depth */
import { minigraphLogger, mothershipLogger } from '@app/core/log';
import { GraphQLClient } from './graphql-client';
import { store } from '@app/store';
import { startDashboardProducer, stopDashboardProducer } from '@app/store/modules/dashboard';
import { EVENTS_SUBSCRIPTION, RemoteAccess_Fragment } from '../graphql/mothership/subscriptions';
import { ClientType } from '@app/graphql/generated/client/graphql';
import { notNull } from '@app/utils';
import { queryServers } from '@app/store/actions/query-servers';
import { KEEP_ALIVE_INTERVAL_MS } from '@app/consts';
import { handleRemoteAccessEvent } from '@app/store/actions/handle-remote-access-event';
import { useFragment } from '@app/graphql/generated/client/fragment-masking';
import { setGraphqlConnectionStatus } from '@app/store/actions/set-minigraph-status';
import { MinigraphStatus } from '@app/graphql/generated/api/types';

let timeoutForOnlineEventReceive: NodeJS.Timeout | null = null;

const setupTimeoutForSelfDisconnectedEvent = () => {
	minigraphLogger.error(`Received disconnect event for own server, waiting for ${KEEP_ALIVE_INTERVAL_MS / 1_000} seconds before setting disconnected`);
	// We have somehow received a disconnected event for ourselves. This can sometimes happen when the event bus unsubscribes us after a long running loop
	timeoutForOnlineEventReceive = setTimeout(() => {
		store.dispatch(setGraphqlConnectionStatus({ status: MinigraphStatus.PING_FAILURE, error: 'Received disconnect event for own server' }));
	}, KEEP_ALIVE_INTERVAL_MS);
};

const clearTimeoutForSelfDisconnectedEvent = () => {
	if (timeoutForOnlineEventReceive) {
		mothershipLogger.trace('Cleared timeout for online event receive');
		clearTimeout(timeoutForOnlineEventReceive);
	}

	timeoutForOnlineEventReceive = null;
};

export const subscribeToEvents = async (apiKey: string) => {
	minigraphLogger.info('Subscribing to Events');
	const client = GraphQLClient.getInstance();
	if (!client) {
		throw new Error('Unable to use client - state must not be loaded');
	}

	const eventsSub = client.subscribe({ query: EVENTS_SUBSCRIPTION, variables: { apiKey }, fetchPolicy: 'no-cache' });
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
							void store.dispatch(queryServers());

							if (eventApiKey === apiKey) {
								// We are online, clear timeout waiting if it's set
								clearTimeoutForSelfDisconnectedEvent();
							}
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
							void store.dispatch(queryServers());

							if (eventApiKey === apiKey) {
								setupTimeoutForSelfDisconnectedEvent();
							}
						}

						// The dashboard was closed or went idle
						if (type === ClientType.DASHBOARD && apiKey === eventApiKey) {
							store.dispatch(stopDashboardProducer());
						}

						break;
					}

					case 'RemoteAccessEvent': {
						const eventAsRemoteAccessEvent = useFragment(RemoteAccess_Fragment, event);

						if (eventAsRemoteAccessEvent.data.apiKey === apiKey) {
							void store.dispatch(handleRemoteAccessEvent(eventAsRemoteAccessEvent));
						}

						break;
					}

					default:
						break;
				}
			}
		}
	});
};
