import type { FastifyRequest } from '@app/unraid-api/types/fastify.js';

export interface RequestOriginInfo {
    protocol: string;
    host: string;
}

export interface RequestInfo extends RequestOriginInfo {
    fullUrl: string;
    baseUrl: string;
}

export function extractRequestOriginInfo(req: FastifyRequest): RequestOriginInfo {
    return {
        protocol: req.protocol || 'http',
        host: req.host || req.hostname || req.headers.host || 'localhost:3000',
    };
}

export function extractRequestInfo(req: FastifyRequest): RequestInfo {
    const { protocol, host } = extractRequestOriginInfo(req);

    const fullUrl = `${protocol}://${host}${req.url}`;
    const baseUrl = `${protocol}://${host}`;

    return {
        protocol,
        host,
        fullUrl,
        baseUrl,
    };
}
