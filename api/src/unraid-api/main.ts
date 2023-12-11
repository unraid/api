import { NestFactory } from '@nestjs/core';
import { Logger as PinoLogger } from 'nestjs-pino';
import { Logger} from '@nestjs/common'
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
import { type FastifyInstance } from 'fastify';
import { type Server, type IncomingMessage, type ServerResponse } from 'http';
import { apiLogger } from '@app/core/log';
export const corsOptionsDelegate: CorsOptionsDelegate = async (
    origin: string | undefined
) => {
    const logger = new Logger('corsOptionsDelegate')
    const allowedOrigins = getAllowedOrigins();
    if (origin && allowedOrigins.includes(origin)) {
        return true;
    } else {
        logger.debug(`Origin not in allowed origins: ${origin}`);
        throw new GraphQLError(
            'The CORS policy for this site does not allow access from the specified Origin.'
        );
    }
};

export async function bootstrapNestServer(): Promise<NestFastifyApplication> {

    const server: FastifyInstance<Server, IncomingMessage, ServerResponse> =
        Fastify({
            logger: false,
        });

    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter(server),
        { cors: { origin: corsOptionsDelegate }, bufferLogs: false }
    );
    app.useLogger(app.get(PinoLogger));

    apiLogger.debug('Starting Nest Server on Port / Path: %s', PORT);
    app.useGlobalFilters(
        new GraphQLExceptionsFilter(),
        new HttpExceptionFilter()
    );

    await app.init();
    if (Number.isNaN(parseInt(PORT))) {
        server.listen({ path: '/var/run/unraid-api.sock' });
    } else {
        server.listen({ port: parseInt(PORT), host: '0.0.0.0' });
    }
    
    apiLogger.debug('Nest Server is now listening');

    return app;
}
