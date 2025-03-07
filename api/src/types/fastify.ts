import type {
    FastifyInstance as BaseFastifyInstance,
    FastifyReply as BaseFastifyReply,
    FastifyRequest as BaseFastifyRequest,
} from 'fastify';

export type FastifyInstance = BaseFastifyInstance;
export interface FastifyRequest extends BaseFastifyRequest {
    cookies?: Record<string, string>;
}
export type FastifyReply = BaseFastifyReply;
