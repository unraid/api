import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch } from '@nestjs/common';

import { type FastifyReply } from 'fastify';
import { GraphQLError } from 'graphql';

@Catch(GraphQLError)
export class GraphQLExceptionsFilter<T extends GraphQLError> implements ExceptionFilter {
    catch(exception: T, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response: FastifyReply<any> = ctx.getResponse<FastifyReply>();

        if (response.code) {
            response.code(200).send({
                data: null,
                errors: [
                    {
                        message: exception.message,
                        locations: exception.locations,
                        path: exception.path,
                    },
                ],
            });
        }
    }
}
