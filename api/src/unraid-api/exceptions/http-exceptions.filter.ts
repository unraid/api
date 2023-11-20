import { Catch, HttpException, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import {type FastifyReply} from 'fastify'

@Catch(HttpException)
export class HttpExceptionFilter<T extends HttpException>
    implements ExceptionFilter
{
    catch(exception: T, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response: FastifyReply<any> = ctx.getResponse<FastifyReply>();

        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();
        const error =
            typeof exceptionResponse === 'string'
                ? { message: exceptionResponse }
                : (exceptionResponse as object);

        response
            .status(status)
            .send({ error, timestamp: new Date().toISOString() });
    }
}
