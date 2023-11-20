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
import { bootstrapNestServer } from '@app/unraid-api/main';

export const createApolloExpressServer = async () => {

    const nestServer = await bootstrapNestServer();

    return nestServer;
};
