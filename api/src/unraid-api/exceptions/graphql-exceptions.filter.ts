import {
    Catch,
    type ArgumentsHost,
    type ExceptionFilter,
} from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { type FastifyReply } from 'fastify';

@Catch(GraphQLError)
export class GraphQLExceptionsFilter<T extends GraphQLError>
    implements ExceptionFilter
{
    catch(exception: T, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response: FastifyReply<any> = ctx.getResponse<FastifyReply>();

        response
            .code(200)
            .send({
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
