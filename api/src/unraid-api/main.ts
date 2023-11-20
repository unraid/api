import { NestFactory,  } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app/app.module';
import {
    FastifyAdapter,
    type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { type CorsOptionsDelegate} from 'cors'

import { getAllowedOrigins } from '@app/common/allowed-origins';
import { HttpExceptionFilter } from '@app/unraid-api/exceptions/http-exceptions.filter';
import { GraphQLError } from 'graphql';
import { GraphQLExceptionsFilter } from '@app/unraid-api/exceptions/graphql-exceptions.filter';
import { getServerAddress } from '@app/common/get-server-address';

export const corsOptionsDelegate: CorsOptionsDelegate = async (
    origin: string | undefined,
) => {
    const allowedOrigins = getAllowedOrigins();
    if (origin && allowedOrigins.includes(origin)) {
        return true;
    } else {
        throw new GraphQLError(
            'The CORS policy for this site does not allow access from the specified Origin.',
        );
    }
};

export async function bootstrapNestServer(port: string): Promise<NestFastifyApplication> {
    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter({ logger: false }),
        { cors: { origin: corsOptionsDelegate } }
    );

    app.useGlobalFilters(
        new HttpExceptionFilter(), 
        new GraphQLExceptionsFilter()
    );

    const logger = new Logger('Nest Setup')
    await app.listen(port, '0.0.0.0');
    logger.debug('listening at ' + getServerAddress(app.getHttpServer()));
    return app;
}

