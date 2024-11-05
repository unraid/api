import { FIVE_MINUTES_MS, MOTHERSHIP_GRAPHQL_LINK } from '@app/consts';
import { minigraphLogger } from '@app/core/log';
import {
    getMothershipConnectionParams,
    getMothershipWebsocketHeaders,
} from '@app/mothership/utils/get-mothership-websocket-headers';
import { getters, store } from '@app/store';
import { type Client, createClient } from 'graphql-ws';
import { setGraphqlConnectionStatus } from '@app/store/actions/set-minigraph-status';
import {
    ApolloClient,
    InMemoryCache,
    type NormalizedCacheObject,
} from '@apollo/client/core/index.js';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions/index.js';
import { MinigraphStatus } from '@app/graphql/generated/api/types';
import { API_VERSION } from '@app/environment';
import {
    receivedMothershipPing,
    setMothershipTimeout,
} from '@app/store/modules/minigraph';
import { logoutUser } from '@app/store/modules/config';
import { RetryLink } from '@apollo/client/link/retry/index.js';
import { ErrorLink } from '@apollo/client/link/error/index.js';
import { isApiKeyValid } from '@app/store/getters/index';
import { buildDelayFunction } from '@app/mothership/utils/delay-function';
import { WebSocket } from 'ws';

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
 
export class GraphQLClient {
    public static instance: ApolloClient<NormalizedCacheObject> | null = null;
    public static client: Client | null = null;
     
    private constructor() {}

    /**
     * Get a singleton GraphQL instance (if possible given loaded state)
     * @returns ApolloClient instance or null, if state is not valid
     */
    public static getInstance(): ApolloClient<NormalizedCacheObject> | null {
        const isStateValid = isAPIStateDataFullyLoaded() && isApiKeyValid();
        if (!isStateValid) {
            minigraphLogger.error(
                'GraphQL Client is not valid. Returning null for instance'
            );
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
            minigraphLogger.debug('Creating a new Apollo Client Instance');
            GraphQLClient.instance = GraphQLClient.createGraphqlClient();
        }

        return GraphQLClient.instance;
    };

    public static clearInstance = async () => {
        if (this.instance) {
            this.instance?.stop();
        }

        if (GraphQLClient.client) {
            await GraphQLClient.client.dispose();
            GraphQLClient.client = null;
        }

        GraphQLClient.instance = null;
        GraphQLClient.client = null;
    };

    static createGraphqlClient() {
        GraphQLClient.client = createClient({
            url: MOTHERSHIP_GRAPHQL_LINK.replace('http', 'ws'),
            webSocketImpl: getWebsocketWithMothershipHeaders(),
            connectionParams: () => getMothershipConnectionParams(),
        });
        const wsLink = new GraphQLWsLink(GraphQLClient.client);

        const retryLink = new RetryLink({
            delay(count, operation, error) {
                if (
                    error instanceof Error &&
                    error.message.includes('API Key Invalid')
                ) {
                    void store.dispatch(
                        logoutUser({ reason: 'Invalid API Key on Mothership' })
                    );
                }
                
                const getDelay = delayFn(count);
                store.dispatch(setMothershipTimeout(getDelay));
                minigraphLogger.info('Delay currently is: %i', getDelay);
                return getDelay;
            },
            attempts: { max: Infinity },
        });
        const errorLink = new ErrorLink((handler) => {
            if (handler.graphQLErrors) {
                // GQL Error Occurred, we should log and move on
                minigraphLogger.info(
                    'GQL Error Encountered %o',
                    handler.graphQLErrors
                );
            } else if (handler.networkError) {
                minigraphLogger.error(
                    'Network Error Encountered %s',
                    handler.networkError.message
                );
                if (
                    getters.minigraph().status !==
                    MinigraphStatus.ERROR_RETRYING
                ) {
                    store.dispatch(
                        setGraphqlConnectionStatus({
                            status: MinigraphStatus.ERROR_RETRYING,
                            error: handler.networkError.message,
                        })
                    );
                }
            }
        });
        const apolloClient = new ApolloClient({
            link: retryLink.concat(errorLink).concat(wsLink),
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
            store.dispatch(
                setGraphqlConnectionStatus({
                    status: MinigraphStatus.CONNECTING,
                    error: null,
                })
            );
            minigraphLogger.info(
                'Connecting to %s',
                MOTHERSHIP_GRAPHQL_LINK.replace('http', 'ws')
            );
        });
        GraphQLClient.client.on('error', (err) => {
            console.log('error', err);
        })
        GraphQLClient.client.on('connected', () => {
            store.dispatch(
                setGraphqlConnectionStatus({
                    status: MinigraphStatus.CONNECTED,
                    error: null,
                })
            );
            minigraphLogger.info(
                'Connected to %s',
                MOTHERSHIP_GRAPHQL_LINK.replace('http', 'ws')
            );
        });

        GraphQLClient.client.on('ping', () => {
            // Received ping from mothership
            minigraphLogger.trace('ping');
            store.dispatch(receivedMothershipPing());
        });
        return apolloClient;
    }
}
