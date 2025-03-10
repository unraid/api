import type {
    FastifyInstance as BaseFastifyInstance,
    FastifyReply as BaseFastifyReply,
    FastifyRequest as BaseFastifyRequest,
} from 'fastify';

// Common headers
export interface CommonHeaders {
    'x-api-key'?: string;
    'x-csrf-token'?: string;
    'x-unraid-api-version'?: string;
    'x-flash-guid'?: string;
}

// Common query parameters
export interface CommonQuery {
    csrf_token?: string;
}

// Base types
type Headers = Record<string, string | string[] | undefined> & Partial<CommonHeaders>;
type Query = Record<string, string | undefined> & Partial<CommonQuery>;
type Cookies = Record<string, string | undefined>;

export type FastifyRequest = BaseFastifyRequest<{
    Headers: Headers;
    Querystring: Query;
}> & {
    cookies: Cookies;
};

export type FastifyInstance = BaseFastifyInstance;
export type FastifyReply = BaseFastifyReply;
