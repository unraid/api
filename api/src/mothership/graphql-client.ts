import type { NormalizedCacheObject } from '@apollo/client/core/index.js';
import type { Client, Event as ClientEvent } from 'graphql-ws';
import { ApolloClient, ApolloLink, InMemoryCache, Observable } from '@apollo/client/core/index.js';
import { ErrorLink } from '@apollo/client/link/error/index.js';
import { RetryLink } from '@apollo/client/link/retry/index.js';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions/index.js';
import { createClient } from 'graphql-ws';
import { WebSocket } from 'ws';

import { FIVE_MINUTES_MS } from '@app/consts.js';
import { minigraphLogger } from '@app/core/log.js';
import { API_VERSION, MOTHERSHIP_GRAPHQL_LINK } from '@app/environment.js';
import { buildDelayFunction } from '@app/mothership/utils/delay-function.js';
import {
    getMothershipConnectionParams,
    getMothershipWebsocketHeaders,
} from '@app/mothership/utils/get-mothership-websocket-headers.js';
import { setGraphqlConnectionStatus } from '@app/store/actions/set-minigraph-status.js';
import { getters, store } from '@app/store/index.js';
import { logoutUser } from '@app/store/modules/config.js';
import { receivedMothershipPing, setMothershipTimeout } from '@app/store/modules/minigraph.js';
import { MinigraphStatus } from '@app/unraid-api/graph/resolvers/cloud/cloud.model.js';

const getWebsocketWithMothershipHeaders = () => {
    return class WebsocketWithMothershipHeaders extends WebSocket {
        constructor(address, protocols) {
            super(address, protocols, {
                headers: getMothershipWebsocketHeaders(),
            });
        }
    };
};

const delayFn = buildDelayFunction({
    jitter: true,
    max: FIVE_MINUTES_MS,
    initial: 10_000,
});

/**
 * Checks that API_VERSION, config.remote.apiKey, emhttp.var.flashGuid, and emhttp.var.version are all set before returning true\
 * Also checks that the API Key has passed Validation from Keyserver
 * @returns boolean, are variables set
 */
export const isAPIStateDataFullyLoaded = (state = store.getState()) => {
    const { config, emhttp } = state;
    return (
        Boolean(API_VERSION) &&
        Boolean(config.remote.apikey) &&
        Boolean(emhttp.var.flashGuid) &&
        Boolean(emhttp.var.version)
    );
};

const isInvalidApiKeyError = (error: unknown) =>
    error instanceof Error && error.message.includes('API Key Invalid');

export class GraphQLClient {
    public static instance: ApolloClient<NormalizedCacheObject> | null = null;
    public static client: Client | null = null;

    private constructor() {}

    /**
     * Get a singleton GraphQL instance (if possible given loaded state)
     * @returns ApolloClient instance or null, if state is not valid
     */
    public static getInstance(): ApolloClient<NormalizedCacheObject> | null {
        const isStateValid = isAPIStateDataFullyLoaded();
        if (!isStateValid) {
            minigraphLogger.error('GraphQL Client is not valid. Returning null for instance');
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
        const isStateValid = isAPIStateDataFullyLoaded();

        if (!GraphQLClient.instance && isStateValid) {
            minigraphLogger.debug('Creating a new Apollo Client Instance');
            GraphQLClient.instance = GraphQLClient.createGraphqlClient();
        }

        return GraphQLClient.instance;
    };

    public static clearInstance = async () => {
        if (this.instance) {
            await this.instance.clearStore();
            this.instance?.stop();
        }

        if (GraphQLClient.client) {
            GraphQLClient.clearClientEventHandlers();
            GraphQLClient.client.terminate();
            await GraphQLClient.client.dispose();
            GraphQLClient.client = null;
        }

        GraphQLClient.instance = null;
        GraphQLClient.client = null;
        minigraphLogger.trace('Cleared GraphQl client & instance');
    };

    static createGraphqlClient() {
        /** a graphql-ws client to communicate with mothership if user opts-in */
        GraphQLClient.client = createClient({
            url: MOTHERSHIP_GRAPHQL_LINK.replace('http', 'ws'),
            webSocketImpl: getWebsocketWithMothershipHeaders(),
            connectionParams: () => getMothershipConnectionParams(),
        });
        const wsLink = new GraphQLWsLink(GraphQLClient.client);
        const { appErrorLink, retryLink, errorLink } = GraphQLClient.createApolloLinks();

        const apolloClient = new ApolloClient({
            link: ApolloLink.from([appErrorLink, retryLink, errorLink, wsLink]),
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
        GraphQLClient.initEventHandlers();
        return apolloClient;
    }

    /**
     * Creates and configures Apollo links for error handling and retries
     *
     * @returns Object containing configured Apollo links:
     * - appErrorLink: Prevents errors from bubbling "up" & potentially crashing the API
     * - retryLink: Handles retrying failed operations with exponential backoff
     * - errorLink: Handles GraphQL and network errors, including API key validation and connection status updates
     */
    static createApolloLinks() {
        /** prevents errors from bubbling beyond this link/apollo instance & potentially crashing the api */
        const appErrorLink = new ApolloLink((operation, forward) => {
            return new Observable((observer) => {
                forward(operation).subscribe({
                    next: (result) => observer.next(result),
                    error: (error) => {
                        minigraphLogger.warn('Apollo error, will not retry: %s', error?.message);
                        observer.complete();
                    },
                    complete: () => observer.complete(),
                });
            });
        });

        /**
         * Max # of times to retry authenticating with mothership.
         * Total # of attempts will be retries + 1.
         */
        const MAX_AUTH_RETRIES = 3;
        const retryLink = new RetryLink({
            delay(count, operation, error) {
                const getDelay = delayFn(count);
                operation.setContext({ retryCount: count });
                store.dispatch(setMothershipTimeout(getDelay));
                minigraphLogger.info('Delay currently is: %i', getDelay);
                return getDelay;
            },
            attempts: {
                max: Infinity,
                retryIf: (error, operation) => {
                    const { retryCount = 0 } = operation.getContext();
                    // i.e. retry api key errors up to 3 times (4 attempts total)
                    return !isInvalidApiKeyError(error) || retryCount < MAX_AUTH_RETRIES;
                },
            },
        });

        const errorLink = new ErrorLink((handler) => {
            const { retryCount = 0 } = handler.operation.getContext();
            minigraphLogger.debug(`Operation attempt: #${retryCount}`);
            if (handler.graphQLErrors) {
                // GQL Error Occurred, we should log and move on
                minigraphLogger.info('GQL Error Encountered %o', handler.graphQLErrors);
            } else if (handler.networkError) {
                /**----------------------------------------------
                 *           Handling of Network Errors
                 *
                 *  When the handler has a void return,
                 *  the network error will bubble up
                 *  (i.e. left in the `ApolloLink.from` array).
                 *
                 *  The underlying operation/request
                 *  may be retried per the retry link.
                 *
                 *  If the error is not retried, it will bubble
                 *  into the appErrorLink and terminate there.
                 *---------------------------------------------**/
                minigraphLogger.error(handler.networkError, 'Network Error');
                const error = handler.networkError;

                if (error?.message?.includes('to be an array of GraphQL errors, but got')) {
                    minigraphLogger.warn('detected malformed graphql error in websocket message');
                }

                if (isInvalidApiKeyError(error)) {
                    if (retryCount >= MAX_AUTH_RETRIES) {
                        store
                            .dispatch(logoutUser({ reason: 'Invalid API Key on Mothership' }))
                            .catch((err) => {
                                minigraphLogger.error(err, 'Error during logout');
                            });
                    }
                } else if (getters.minigraph().status !== MinigraphStatus.ERROR_RETRYING) {
                    store.dispatch(
                        setGraphqlConnectionStatus({
                            status: MinigraphStatus.ERROR_RETRYING,
                            error: handler.networkError.message,
                        })
                    );
                }
            }
        });
        return { appErrorLink, retryLink, errorLink } as const;
    }

    /**
     * Initialize event handlers for the GraphQL client websocket connection
     *
     * Sets up handlers for:
     * - 'connecting': Updates store with connecting status and logs connection attempt
     * - 'error': Logs any GraphQL client errors
     * - 'connected': Updates store with connected status and logs successful connection
     * - 'ping': Handles ping messages from mothership to track connection health
     *
     * @param client - The GraphQL client instance to attach handlers to. Defaults to GraphQLClient.client
     * @returns void
     */
    private static initEventHandlers(client = GraphQLClient.client): void {
        if (!client) return;
        // Maybe a listener to initiate this
        client.on('connecting', () => {
            store.dispatch(
                setGraphqlConnectionStatus({
                    status: MinigraphStatus.CONNECTING,
                    error: null,
                })
            );
            minigraphLogger.info('Connecting to %s', MOTHERSHIP_GRAPHQL_LINK.replace('http', 'ws'));
        });
        client.on('error', (err) => {
            minigraphLogger.error('GraphQL Client Error: %o', err);
        });
        client.on('connected', () => {
            store.dispatch(
                setGraphqlConnectionStatus({
                    status: MinigraphStatus.CONNECTED,
                    error: null,
                })
            );
            minigraphLogger.info('Connected to %s', MOTHERSHIP_GRAPHQL_LINK.replace('http', 'ws'));
        });

        client.on('ping', () => {
            // Received ping from mothership
            minigraphLogger.trace('ping');
            store.dispatch(receivedMothershipPing());
        });
    }

    /**
     * Clears event handlers from the GraphQL client websocket connection
     *
     * Removes handlers for the specified events by replacing them with empty functions.
     * This ensures no lingering event handlers remain when disposing of a client.
     *
     * @param client - The GraphQL client instance to clear handlers from. Defaults to GraphQLClient.client
     * @param events - Array of event types to clear handlers for. Defaults to ['connected', 'connecting', 'error', 'ping']
     * @returns void
     */
    private static clearClientEventHandlers(
        client = GraphQLClient.client,
        events: ClientEvent[] = ['connected', 'connecting', 'error', 'ping']
    ): void {
        if (!client) return;
        events.forEach((eventName) => client.on(eventName, () => {}));
    }
}
