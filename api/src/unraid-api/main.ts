import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify/index.js';

import fastifyCookie from '@fastify/cookie';
import fastifyHelmet from '@fastify/helmet';
import { LoggerErrorInterceptor, Logger as PinoLogger } from 'nestjs-pino';

import { apiLogger } from '@app/core/log.js';
import { LOG_LEVEL, PORT } from '@app/environment.js';
import { AppModule } from '@app/unraid-api/app/app.module.js';
import { GraphQLExceptionsFilter } from '@app/unraid-api/exceptions/graphql-exceptions.filter.js';
import { HttpExceptionFilter } from '@app/unraid-api/exceptions/http-exceptions.filter.js';

export async function bootstrapNestServer(): Promise<NestFastifyApplication> {
    apiLogger.debug('Creating Nest Server');

    const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
        bufferLogs: false,
        ...(LOG_LEVEL !== 'TRACE' ? { logger: false } : {}),
    });
    app.enableShutdownHooks(['SIGINT', 'SIGTERM', 'SIGQUIT']);

    // Enable validation globally
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        })
    );

    const server = app.getHttpAdapter().getInstance();

    /**------------------------------------------------------------------------
     * !                       Fastify Type Compatibility
     *
     * There are known type issues with fastify plugin registration in nestjs.
     * These don't affect runtime functionality, but will cause type errors.
     *
     * See: https://github.com/nestjs/nest/issues/13219
     *
     * tl;dr different types used by nestjs/platform-fastify and fastify.
     *------------------------------------------------------------------------**/

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Known nestjs x fastify type compatibility issue
    await server.register(fastifyCookie);

    // Minimal Helmet configuration to avoid blocking plugin functionality
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Known nestjs x fastify type compatibility issue
    await server.register(fastifyHelmet, {
        // Disable restrictive policies
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: false,
        crossOriginResourcePolicy: false,

        // Basic security headers that don't restrict functionality
        xssFilter: true,
        hidePoweredBy: true,

        // Additional safe headers
        noSniff: true, // Prevents MIME type sniffing
        ieNoOpen: true, // Prevents IE from executing downloads in site context
        permittedCrossDomainPolicies: true, // Restricts Adobe Flash and PDF access
        referrerPolicy: { policy: 'no-referrer-when-downgrade' }, // Safe referrer policy
        frameguard: false, // Turn off for plugin compatibility

        // HSTS disabled to avoid issues with running on local networks
        hsts: false,
    });

    // Add sandbox access control hook
    server.addHook('preHandler', async (request, reply) => {
        // Only block GET requests to /graphql when sandbox is disabled
        if (request.method === 'GET') {
            // Extract pathname without query parameters
            const urlPath = request.url.split('?')[0];

            if (urlPath === '/graphql') {
                const configService = app.get(ConfigService);
                const sandboxValue = configService.get('api.sandbox');

                // Robustly coerce to boolean - only true when explicitly true
                const sandboxEnabled =
                    sandboxValue === true ||
                    (typeof sandboxValue === 'string' && sandboxValue.toLowerCase() === 'true');

                if (!sandboxEnabled) {
                    reply.status(403).send({
                        errors: [
                            {
                                message: 'GraphQL sandbox is disabled. Enable it in the API settings.',
                                extensions: {
                                    code: 'SANDBOX_DISABLED',
                                },
                            },
                        ],
                    });
                    return;
                }
            }
        }
    });

    // Allows all origins but still checks authentication
    app.enableCors({
        origin: true, // Allows all origins
        credentials: true,
        methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'X-CSRF-TOKEN',
            'X-API-KEY',
        ],
    });

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
