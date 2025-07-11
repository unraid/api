import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

import {
    ApolloClient,
    ApolloLink,
    InMemoryCache,
    NormalizedCacheObject,
    Observable,
} from '@apollo/client/core/index.js';
import { ErrorLink } from '@apollo/client/link/error/index.js';
import { RetryLink } from '@apollo/client/link/retry/index.js';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions/index.js';
import { Client, createClient } from 'graphql-ws';
import { WebSocket } from 'ws';

import { MinigraphStatus } from '../config/connect.config.js';
import { RemoteGraphQlEventType } from '../graphql/generated/client/graphql.js';
import { SEND_REMOTE_QUERY_RESPONSE } from '../graphql/remote-response.js';
import { buildDelayFunction } from '../helper/delay-function.js';
import { EVENTS } from '../helper/nest-tokens.js';
import { MothershipConnectionService } from './connection.service.js';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

type Unsubscribe = () => void;

@Injectable()
export class MothershipGraphqlClientService implements OnModuleInit, OnModuleDestroy {
    private logger = new Logger(MothershipGraphqlClientService.name);
    private apolloClient: ApolloClient<NormalizedCacheObject> | null = null;
    private wsClient: Client | null = null;
    private delayFn = buildDelayFunction({
        jitter: true,
        max: FIVE_MINUTES_MS,
        initial: 10_000,
    });
    private isStateValid = () => this.connectionService.getIdentityState().isLoaded;
    private disposalQueue: Unsubscribe[] = [];

    get apiVersion() {
        return this.configService.getOrThrow('API_VERSION');
    }

    get mothershipGraphqlLink() {
        return this.configService.getOrThrow('MOTHERSHIP_GRAPHQL_LINK');
    }

    constructor(
        private readonly configService: ConfigService,
        private readonly connectionService: MothershipConnectionService,
        private readonly eventEmitter: EventEmitter2
    ) {}

    /**
     * Initialize the GraphQL client when the module is created
     */
    async onModuleInit(): Promise<void> {
        this.configService.getOrThrow('API_VERSION');
        this.configService.getOrThrow('MOTHERSHIP_GRAPHQL_LINK');
    }

    /**
     * Clean up resources when the module is destroyed
     */
    async onModuleDestroy(): Promise<void> {
        await this.clearInstance();
    }

    async sendQueryResponse(sha256: string, body: { data?: unknown; errors?: unknown }) {
        try {
            const result = await this.getClient()?.mutate({
                mutation: SEND_REMOTE_QUERY_RESPONSE,
                variables: {
                    input: {
                        sha256,
                        body: JSON.stringify(body),
                        type: RemoteGraphQlEventType.REMOTE_QUERY_EVENT,
                    },
                },
            });
            return result;
        } catch (error) {
            this.logger.error(
                'Failed to send query response to mothership. %s %O\n%O',
                sha256,
                error,
                body
            );
        }
    }

    /**
     * Get the Apollo client instance (if possible given loaded state)
     * @returns ApolloClient instance or null, if state is not valid
     */
    getClient(): ApolloClient<NormalizedCacheObject> | null {
        if (this.isStateValid()) {
            return this.apolloClient;
        }
        this.logger.debug('Identity state is not valid. Returning null client instance');
        return null;
    }

    /**
     * Create a new Apollo client instance if one doesn't exist and state is valid
     */
    async createClientInstance(): Promise<ApolloClient<NormalizedCacheObject>> {
        return this.getClient() ?? this.createGraphqlClient();
    }

    /**
     * Clear the Apollo client instance and WebSocket client
     */
    async clearInstance(): Promise<void> {
        if (this.apolloClient) {
            try {
                await this.apolloClient.clearStore();
                // some race condition causes apolloClient to be null here upon api shutdown?
                this.apolloClient?.stop();
            } catch (error) {
                this.logger.warn(error, 'Error clearing apolloClient');
            }
            this.apolloClient = null;
        }

        if (this.wsClient) {
            this.clearClientEventHandlers();
            try {
                await this.wsClient.dispose();
            } catch (error) {
                this.logger.warn(error, 'Error disposing of wsClient');
            }
            this.wsClient = null;
        }

        this.logger.verbose('Cleared GraphQl client & instance');
    }

    /**
     * Create a new Apollo client with WebSocket link
     */
    private createGraphqlClient(): ApolloClient<NormalizedCacheObject> {
        this.logger.verbose('Creating a new Apollo Client Instance');
        this.wsClient = createClient({
            url: this.mothershipGraphqlLink.replace('http', 'ws'),
            webSocketImpl: this.getWebsocketWithMothershipHeaders(),
            connectionParams: () => this.connectionService.getWebsocketConnectionParams(),
        });

        const wsLink = new GraphQLWsLink(this.wsClient);
        const { appErrorLink, retryLink, errorLink } = this.createApolloLinks();

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

        this.initEventHandlers();
        this.apolloClient = apolloClient;
        return this.apolloClient;
    }

    /**
     * Create a WebSocket class with Mothership headers
     */
    private getWebsocketWithMothershipHeaders() {
        const getHeaders = () => this.connectionService.getMothershipWebsocketHeaders();
        return class WebsocketWithMothershipHeaders extends WebSocket {
            constructor(address: string | URL, protocols?: string | string[]) {
                super(address, protocols, {
                    headers: getHeaders(),
                });
            }
        };
    }

    /**
     * Check if an error is an invalid API key error
     */
    private isInvalidApiKeyError(error: unknown): boolean {
        return (
            typeof error === 'object' &&
            error !== null &&
            'message' in error &&
            typeof error.message === 'string' &&
            error.message.includes('API Key Invalid')
        );
    }

    /**
     * Create Apollo links for error handling and retries
     */
    private createApolloLinks() {
        /** prevents errors from bubbling beyond this link/apollo instance & potentially crashing the api */
        const appErrorLink = new ApolloLink((operation, forward) => {
            return new Observable((observer) => {
                forward(operation).subscribe({
                    next: (result) => observer.next(result),
                    error: (error) => {
                        this.logger.warn('Apollo error, will not retry: %s', error?.message);
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
            delay: (count, operation, error) => {
                const getDelay = this.delayFn(count);
                operation.setContext({ retryCount: count });
                // note: unsure where/whether
                // store.dispatch(setMothershipTimeout(getDelay));
                this.configService.set('connect.mothership.timeout', getDelay);
                this.logger.log('Delay currently is: %i', getDelay);
                return getDelay;
            },
            attempts: {
                max: Infinity,
                retryIf: (error, operation) => {
                    const { retryCount = 0 } = operation.getContext();
                    // i.e. retry api key errors up to 3 times (4 attempts total)
                    return !this.isInvalidApiKeyError(error) || retryCount < MAX_AUTH_RETRIES;
                },
            },
        });

        const errorLink = new ErrorLink((handler) => {
            const { retryCount = 0 } = handler.operation.getContext();
            this.logger.debug(`Operation attempt: #${retryCount}`);

            if (handler.graphQLErrors) {
                this.logger.log('GQL Error Encountered %o', handler.graphQLErrors);
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
                this.logger.error(handler.networkError, 'Network Error');
                const error = handler.networkError;

                if (error?.message?.includes('to be an array of GraphQL errors, but got')) {
                    this.logger.warn('detected malformed graphql error in websocket message');
                }

                if (this.isInvalidApiKeyError(error)) {
                    if (retryCount >= MAX_AUTH_RETRIES) {
                        this.eventEmitter.emit(EVENTS.LOGOUT, {
                            reason: 'Invalid API Key on Mothership',
                        });
                    }
                } else if (
                    this.connectionService.getConnectionState()?.status !==
                    MinigraphStatus.ERROR_RETRYING
                ) {
                    this.connectionService.setConnectionStatus({
                        status: MinigraphStatus.ERROR_RETRYING,
                        error: handler.networkError.message,
                    });
                }
            }
        });

        return { appErrorLink, retryLink, errorLink } as const;
    }

    /**
     * Initialize event handlers for the GraphQL client WebSocket connection
     */
    private initEventHandlers(): void {
        if (!this.wsClient) return;

        const disposeConnecting = this.wsClient.on('connecting', () => {
            this.connectionService.setConnectionStatus({
                status: MinigraphStatus.CONNECTING,
                error: null,
            });
            this.logger.log('Connecting to %s', this.mothershipGraphqlLink.replace('http', 'ws'));
        });

        const disposeError = this.wsClient.on('error', (err) => {
            this.logger.error('GraphQL Client Error: %o', err);
        });

        const disposeConnected = this.wsClient.on('connected', () => {
            this.connectionService.setConnectionStatus({
                status: MinigraphStatus.CONNECTED,
                error: null,
            });
            this.logger.log('Connected to %s', this.mothershipGraphqlLink.replace('http', 'ws'));
        });

        const disposePing = this.wsClient.on('ping', () => {
            this.logger.verbose('ping');
            this.connectionService.receivePing();
        });

        this.disposalQueue.push(disposeConnecting, disposeConnected, disposePing, disposeError);
    }

    /**
     * Clear event handlers from the GraphQL client WebSocket connection
     */
    private clearClientEventHandlers(
        events: Array<'connected' | 'connecting' | 'error' | 'ping'> = [
            'connected',
            'connecting',
            'error',
            'ping',
        ]
    ): void {
        if (!this.wsClient) return;
        while (this.disposalQueue.length > 0) {
            const dispose = this.disposalQueue.shift();
            dispose?.();
        }
    }
}
