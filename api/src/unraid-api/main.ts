import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';



import fastifyCookie from '@fastify/cookie';
import { LoggerErrorInterceptor, Logger as PinoLogger } from 'nestjs-pino';



import { apiLogger } from '@app/core/log.js';
import { LOG_LEVEL, PORT } from '@app/environment.js';
import { AppModule } from '@app/unraid-api/app/app.module.js';
import { configureFastifyCors } from '@app/unraid-api/app/cors.js';
import { CookieService } from '@app/unraid-api/auth/cookie.service.js';
import { GraphQLExceptionsFilter } from '@app/unraid-api/exceptions/graphql-exceptions.filter.js';
import { HttpExceptionFilter } from '@app/unraid-api/exceptions/http-exceptions.filter.js';





export async function bootstrapNestServer(): Promise<NestFastifyApplication> {
    apiLogger.debug('Creating Nest Server');

    const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
        bufferLogs: false,
        ...(LOG_LEVEL !== 'TRACE' ? { logger: false } : {}),
    });

    const server = app.getHttpAdapter().getInstance();

    await app.register(fastifyCookie as unknown as Parameters<NestFastifyApplication['register']>[0]); // parse cookies before cors

    const cookieService = app.get(CookieService);
    app.enableCors(configureFastifyCors(cookieService));

    // Setup Nestjs Pino Logger
    app.useLogger(app.get(PinoLogger));
    app.useGlobalInterceptors(new LoggerErrorInterceptor());
    app.flushLogs();

    apiLogger.info('Starting Nest Server on Port / Path: %s', PORT);
    app.useGlobalFilters(new GraphQLExceptionsFilter(), new HttpExceptionFilter());
    await app.init();

    if (Number.isNaN(parseInt(PORT))) {
        const result = await server.listen({ path: '/var/run/unraid-api.sock' });
        apiLogger.info('Server listening on %s', result);
    } else {
        const result = await server.listen({ port: parseInt(PORT), host: '0.0.0.0' });
        apiLogger.info('Server listening on %s', result);
    }

    // This 'ready' signal tells pm2 that the api has started.
    // PM2 documents this as Graceful Start or Clean Restart.
    // See https://pm2.keymetrics.io/docs/usage/signals-clean-restart/
    if (process.send) {
        process.send('ready');
    } else {
        apiLogger.warn(
            'Warning: process.send is unavailable. This will affect IPC communication with PM2.'
        );
    }
    apiLogger.info('Nest Server is now listening');

    return app;
}