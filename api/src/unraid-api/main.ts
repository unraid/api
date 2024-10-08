import { NestFactory } from '@nestjs/core';
import { LoggerErrorInterceptor, Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app/app.module';
import Fastify from 'fastify';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { type CorsOptionsDelegate } from 'cors';

import { getAllowedOrigins } from '@app/common/allowed-origins';
import { HttpExceptionFilter } from '@app/unraid-api/exceptions/http-exceptions.filter';
import { GraphQLError } from 'graphql';
import { GraphQLExceptionsFilter } from '@app/unraid-api/exceptions/graphql-exceptions.filter';
import { BYPASS_PERMISSION_CHECKS, PORT } from '@app/environment';
import { type FastifyInstance } from 'fastify';
import { type Server, type IncomingMessage, type ServerResponse } from 'http';
import { apiLogger } from '@app/core/log';
import cookieParser from 'cookie-parser';

export const corsOptionsDelegate: CorsOptionsDelegate = async (origin: string | undefined) => {
    const allowedOrigins = getAllowedOrigins();
    if (origin && allowedOrigins.includes(origin)) {
        return true;
    } else {
        apiLogger.debug(`Origin not in allowed origins: ${origin}`);

        if (BYPASS_PERMISSION_CHECKS) {
            return true;
        }

        throw new GraphQLError(
            'The CORS policy for this site does not allow access from the specified Origin.'
        );
    }
};

export async function bootstrapNestServer(): Promise<NestFastifyApplication> {
    const server: FastifyInstance<Server, IncomingMessage, ServerResponse> = Fastify({
        logger: false,
    });

    const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(server), {
        cors: { origin: corsOptionsDelegate },
        bufferLogs: true,
    });

    app.use(cookieParser());

    // Setup Nestjs Pino Logger
    app.useLogger(app.get(PinoLogger));
    app.useGlobalInterceptors(new LoggerErrorInterceptor());
    app.flushLogs();

    apiLogger.debug('Starting Nest Server on Port / Path: %s', PORT);
    app.useGlobalFilters(new GraphQLExceptionsFilter(), new HttpExceptionFilter());

    await app.init();
    if (Number.isNaN(parseInt(PORT))) {
        server.listen({ path: '/var/run/unraid-api.sock' });
    } else {
        server.listen({ port: parseInt(PORT), host: '0.0.0.0' });
    }

    //await app.getHttpAdapter().listen(PORT);
    apiLogger.debug('Nest Server is now listening');

    return app;
}
