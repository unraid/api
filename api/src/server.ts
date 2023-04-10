/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import path from 'path';
import cors from 'cors';
import { watch } from 'chokidar';
import express, { json, type Request, type Response } from 'express';
import http from 'http';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { logger, config, pubsub, graphqlLogger } from '@app/core';
import { verifyTwoFactorToken } from '@app/common/two-factor';
import display from '@app/graphql/resolvers/query/display';
import { getters } from '@app/store';
import { schema } from '@app/graphql/schema';
import { execute, subscribe } from 'graphql';
import { GRAPHQL_WS, SubscriptionServer } from 'subscriptions-transport-ws';
import { wsHasConnected, wsHasDisconnected } from '@app/ws';
import { apiKeyToUser } from '@app/graphql';
import { randomUUID } from 'crypto';
import { getServerAddress } from '@app/common/get-server-address';
import { originMiddleware } from '@app/originMiddleware';
import { API_VERSION, GRAPHQL_INTROSPECTION } from '@app/environment';
import {
    getBannerPathIfPresent,
    getCasePathIfPresent,
} from '@app/core/utils/images/image-file-helpers';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { GRAPHQL_TRANSPORT_WS_PROTOCOL } from 'graphql-ws';


const configFilePath = path.join(
    getters.paths()['dynamix-base'],
    'case-model.cfg'
);
const customImageFilePath = path.join(
    getters.paths()['dynamix-base'],
    'case-model.png'
);

const updatePubsub = async () => {
    await pubsub.publish('display', {
        display: await display(),
    });
};

// Update pub/sub when config/image file is added/updated/removed
watch(configFilePath).on('all', updatePubsub);
watch(customImageFilePath).on('all', updatePubsub);

export const createApolloExpressServer = async (port: string) => {
    const app = express();
    const httpServer = http.createServer(app);

    app.use(json());

    // Cors
    app.use(cors());
    app.use(originMiddleware);

    // Add Unraid API version header
    app.use(async (_req, res, next) => {
        // Only get the machine ID on first request
        // We do this to avoid using async in the main server function
        if (!app.get('x-unraid-api-version')) {
            app.set('x-unraid-api-version', API_VERSION);
        }

        // Update header with unraid API version
        res.set('x-unraid-api-version', app.get('x-unraid-api-version'));

        next();
    });

    // Log only if the server actually binds to the port
    httpServer.on('listening', () => {
        logger.info('Server is up! %s', getServerAddress(httpServer));
    });

    // graphql-ws
    const graphqlWs = new WebSocketServer({ noServer: true });

    // subscriptions-transport-ws
    const subTransWs = new WebSocketServer({
        noServer: true,
    });

    // graphql-ws setup
    const graphqlWsServer = useServer<
        { 'x-api-key': string },
        { context: { user: any; websocketId: string } }
    >(
        {
            schema,
            onError(ctx, message, errors) {
                logger.debug('%o %o %o', ctx, message, errors);
            },
            async onConnect(ctx) {
                logger.debug(
                    'Connecting new client with params: %o',
                    ctx.connectionParams
                );
                const params: unknown = ctx.connectionParams?.['x-api-key'];
                if (params && typeof params === 'string') {
                    const apiKey = params;
                    const user = await apiKeyToUser(apiKey);
                    const websocketId = randomUUID();
                    logger.debug('User is %o', user);
                    ctx.extra.context = { user, websocketId };
                    return true;
                }
                return {};
            },
            context: (ctx) => {
                return ctx.extra.context;
            },
        },
        graphqlWs
    );

    // subscriptions-transport-ws setup
    const subscriptionsTransportServer = SubscriptionServer.create(
        {
            // This is the `schema` we just created.
            schema,
            // These are imported from `graphql`.
            execute,
            subscribe,
            // Ensure keep-alive packets are sent
            keepAlive: 10_000,
            // Providing `onConnect` is the `SubscriptionServer` equivalent to the
            // `context` function in `ApolloServer`. Please [see the docs](https://github.com/apollographql/subscriptions-transport-ws#constructoroptions-socketoptions--socketserver)
            // for more information on this hook.
            async onConnect(connectionParams: { 'x-api-key': string }) {
                const apiKey = connectionParams['x-api-key'];
                const user = await apiKeyToUser(apiKey);
                const websocketId = randomUUID();

                graphqlLogger.addContext('websocketId', websocketId);
                graphqlLogger.debug('%s connected', user.name);
                graphqlLogger.removeContext('websocketId');

                // Update ws connection count and other needed values
                wsHasConnected(websocketId);

                return {
                    user,
                    websocketId,
                };
            },
            async onDisconnect(
                _,
                websocketContext: {
                    initPromise: Promise<
                        | boolean
                        | {
                              user: {
                                  name: string;
                              };
                              websocketId: string;
                          }
                    >;
                }
            ) {
                const context = await websocketContext.initPromise;

                // The websocket has disconnected before init event has resolved
                // @see: https://github.com/apollographql/subscriptions-transport-ws/issues/349
                if (context === true || context === false) {
                    // This seems to also happen if a tab is left open and then a server starts up
                    // The tab hits the server over and over again without sending init
                    graphqlLogger.debug('unknown disconnected');
                    return;
                }

                const { user, websocketId } = context;

                graphqlLogger.addContext('websocketId', websocketId);
                graphqlLogger.debug('%s disconnected.', user.name);
                graphqlLogger.removeContext('websocketId');

                // Update ws connection count and other needed values
                wsHasDisconnected(websocketId);
            },
        },
        subTransWs
    );

    const apolloServerPluginOnExit = {
        async serverWillStart() {
            return {
                /**
                 * When the app exits this will be run.
                 */
                async drainServer() {
                    // Close all connections to subscriptions server
                    subscriptionsTransportServer.close();
                    graphqlWsServer.dispose();
                },
            };
        },
    };

    // Create graphql instance
    const apolloServer = new ApolloServer({
        schema,
        plugins: [
            apolloServerPluginOnExit,
            ApolloServerPluginDrainHttpServer({ httpServer }),
        ],
        introspection: GRAPHQL_INTROSPECTION
    });

    await apolloServer.start()

    app.use(
        '/graphql',
        cors(),
        json(),
        expressMiddleware(apolloServer, {
            context: async ({ req }) => {
                // Normal Websocket connection
                /* if (connection && Object.keys(connection.context).length >= 1) {
                    // Check connection for metadata
                    return {
                        ...connection.context,
                    };
                } */

                // Normal HTTP connection
                if (
                    req &&
                    req.headers['x-api-key'] &&
                    typeof req.headers['x-api-key'] === 'string'
                ) {
                    const apiKey = req.headers['x-api-key'];
                    const user = await apiKeyToUser(apiKey);

                    return {
                        user,
                    };
                }

                throw new Error('Invalid API key');
            },
        })
    );

    httpServer.on('upgrade', (req, socket, head) => {
        // extract websocket subprotocol from header
        const protocol = req.headers['sec-websocket-protocol'];
        const protocols = Array.isArray(protocol)
            ? protocol
            : protocol?.split(',').map((p) => p.trim());

        // decide which websocket server to use
        const wss =
            protocols?.includes(GRAPHQL_WS) && // subscriptions-transport-ws subprotocol
            !protocols.includes(GRAPHQL_TRANSPORT_WS_PROTOCOL) // graphql-ws subprotocol
                ? subTransWs
                : // graphql-ws will welcome its own subprotocol and
                  // gracefully reject invalid ones. if the client supports
                  // both transports, graphql-ws will prevail
                  graphqlWs;
        wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit('connection', ws, req);
        });
    });

    // List all endpoints at start of server
    app.get('/', (_, res: Response) => res.status(200).send('OK'));

    app.post('/verify', async (req, res) => {
        try {
            // Check two-factor token is valid
            verifyTwoFactorToken(req.body?.username, req.body?.token);

            // Success
            logger.debug('2FA token valid, allowing login.');

            // Allow the user to pass
            res.sendStatus(204);
            return;
        } catch (error: unknown) {
            logger.addContext('error', error);
            logger.error('Failed validating 2FA token.');
            logger.removeContext('error');

            // User failed verification
            res.status(401);
            res.send((error as Error).message);
        }
    });

    app.get(
        '/graphql/api/customizations/:type',
        async (req: Request, res: Response) => {
            // @TODO - Clean up this function
            const apiKey = req.headers['x-api-key'];
            if (
                apiKey &&
                typeof apiKey === 'string' &&
                (await apiKeyToUser(apiKey)).role !== 'guest'
            ) {
                if (req.params.type === 'banner') {
                    const path = await getBannerPathIfPresent();
                    if (path) {
                        res.sendFile(path);
                        return;
                    }
                } else if (req.params.type === 'case') {
                    const path = await getCasePathIfPresent();
                    if (path) {
                        res.sendFile(path);
                        return;
                    }
                }

                return res
                    .status(404)
                    .send('no customization of this type found');
            }

            return res.status(403).send('unauthorized');
        }
    );

    // Handle errors by logging them and returning a 500.
    app.use(
        (
            error: Error & { stackTrace?: string; status?: number },
            _,
            res: Response,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            __
        ) => {
            // Don't log CORS errors
            if (error.message.includes('CORS')) return;

            logger.error(error);

            if (error.stack) {
                error.stackTrace = error.stack;
            }

            res.status(error.status ?? 500).send(error);
        }
    );
    
	httpServer.listen(config.port);
    return apolloServer;
};
