import path from 'path';
import cors from 'cors';
import { watch } from 'chokidar';
import express, { json, type Request, type Response } from 'express';
import http from 'http';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { logger, pubsub, graphqlLogger } from '@app/core';
import { getters } from '@app/store';
import { schema } from '@app/graphql/schema';
import { execute, subscribe } from 'graphql';
import { GRAPHQL_WS, SubscriptionServer } from 'subscriptions-transport-ws';
import { wsHasConnected, wsHasDisconnected } from '@app/ws';
import { randomUUID } from 'crypto';
import { getServerAddress } from '@app/common/get-server-address';
import { originMiddleware } from '@app/originMiddleware';
import { API_VERSION, GRAPHQL_INTROSPECTION, PORT } from '@app/environment';
import {
    getBannerPathIfPresent,
    getCasePathIfPresent,
} from '@app/core/utils/images/image-file-helpers';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { GRAPHQL_TRANSPORT_WS_PROTOCOL } from 'graphql-ws';
import { bootstrapNestServer } from '@app/unraid-api/main';

export const createApolloExpressServer = async () => {

    const nestServer = await bootstrapNestServer(PORT);

    return nestServer;
};
