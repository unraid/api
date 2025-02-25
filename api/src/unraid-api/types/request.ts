import type { FastifyRequest } from '@app/types/fastify.js';

export interface CustomRequest extends FastifyRequest {
    headers: FastifyRequest['headers'] & { 'x-csrf-token'?: string };
}
