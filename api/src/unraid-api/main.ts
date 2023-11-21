import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app/app.module';
import Fastify from 'fastify';
import {
    FastifyAdapter,
    type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { type CorsOptionsDelegate } from 'cors';

import { getAllowedOrigins } from '@app/common/allowed-origins';
import { HttpExceptionFilter } from '@app/unraid-api/exceptions/http-exceptions.filter';
import { GraphQLError } from 'graphql';
import { GraphQLExceptionsFilter } from '@app/unraid-api/exceptions/graphql-exceptions.filter';
import { PORT } from '@app/environment';
import { ShutdownObserver } from '@app/unraid-api/observers/shutdown.observer';
import { type FastifyInstance } from 'fastify';
import { type Server, type IncomingMessage, type ServerResponse } from 'http';
export const corsOptionsDelegate: CorsOptionsDelegate = async (
    origin: string | undefined
) => {
    const allowedOrigins = getAllowedOrigins();
    if (origin && allowedOrigins.includes(origin)) {
        return true;
    } else {
        throw new GraphQLError(
            'The CORS policy for this site does not allow access from the specified Origin.'
        );
    }
};

export async function bootstrapNestServer(): Promise<NestFastifyApplication> {
    const logger = new Logger('bootstrapNestServer');

    const server: FastifyInstance<Server, IncomingMessage, ServerResponse> =
        Fastify({
            logger: true,
        });

    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter(server),
        { cors: { origin: corsOptionsDelegate } }
    );

    app.useGlobalFilters(
        new HttpExceptionFilter(),
        new GraphQLExceptionsFilter()
    );

    await app.init();
    logger.debug('Starting Nest Server on Port / Path: ' + PORT);
    if (Number.isNaN(parseInt(PORT))) {
        server.listen({ path: '/var/run/unraid-api.sock' });
    } else {
        server.listen({ port: parseInt(PORT), host: '0.0.0.0' });
    }

    //await app.getHttpAdapter().listen(PORT);
    logger.debug('Nest Server is now listening');

    return app;
}
