import type { FastifyRequest } from '@app/types/fastify';

export interface CustomRequest extends FastifyRequest {
    headers: FastifyRequest['headers'] & { 'x-csrf-token'?: string };
}
