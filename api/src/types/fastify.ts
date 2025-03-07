import type {
    FastifyInstance as BaseFastifyInstance,
    FastifyReply as BaseFastifyReply,
    FastifyRequest as BaseFastifyRequest,
} from 'fastify';

export type FastifyInstance = BaseFastifyInstance;
export interface FastifyRequest extends BaseFastifyRequest {
    cookies: { [cookieName: string]: string | undefined };
}
export type FastifyReply = BaseFastifyReply;
