import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException, Logger } from '@nestjs/common';

import { type FastifyReply } from 'fastify';

@Catch(HttpException)
export class HttpExceptionFilter<T extends HttpException> implements ExceptionFilter {
    protected logger = new Logger('HttpExceptionFilter');

    catch(exception: T, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response: FastifyReply<any> = ctx.getResponse<FastifyReply>();
        // if response is empty object, rethrow
        if (
            Object.keys(response).length === 0 ||
            !response.status ||
            typeof response.status !== 'function'
        ) {
            throw exception;
        }

        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();
        const error =
            typeof exceptionResponse === 'string'
                ? { message: exceptionResponse }
                : (exceptionResponse as object);

        this.logger.error(`HttpException: ${JSON.stringify(error)}`);
        return response.status(status).send({ error, timestamp: new Date().toISOString() });
    }
}
