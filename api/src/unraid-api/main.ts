import { NestFactory } from '@nestjs/core';
import { LoggerErrorInterceptor, Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app/app.module';
import Fastify from 'fastify';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';

import { HttpExceptionFilter } from '@app/unraid-api/exceptions/http-exceptions.filter';
import { GraphQLExceptionsFilter } from '@app/unraid-api/exceptions/graphql-exceptions.filter';
import { PORT } from '@app/environment';
import { type FastifyInstance } from 'fastify';
import { type Server, type IncomingMessage, type ServerResponse } from 'http';
import { apiLogger } from '@app/core/log';
import fastifyCookie from '@fastify/cookie';
import { configureFastifyCors } from './app/cors';
import { CookieService } from './auth/cookie.service';

export async function bootstrapNestServer(): Promise<NestFastifyApplication> {
    const server: FastifyInstance<Server, IncomingMessage, ServerResponse> = Fastify({
        logger: false,
    });

    const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(server), {
        bufferLogs: true,
    });

    app.register(fastifyCookie); // parse cookies before cors

    const cookieService = app.get(CookieService);
    app.enableCors(configureFastifyCors(cookieService));

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
