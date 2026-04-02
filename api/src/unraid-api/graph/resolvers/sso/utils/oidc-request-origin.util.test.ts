import { describe, expect, it } from 'vitest';

import type { FastifyRequest } from '@app/unraid-api/types/fastify.js';
import {
    extractRequestInfo,
    extractRequestOriginInfo,
} from '@app/unraid-api/graph/resolvers/sso/utils/oidc-request-origin.util.js';

describe('oidc-request-origin util', () => {
    it('prefers Fastify protocol and host values', () => {
        const req = {
            protocol: 'https',
            host: 'nas.domain.com',
            hostname: 'nas.domain.com',
        } as FastifyRequest;

        expect(extractRequestOriginInfo(req)).toEqual({
            protocol: 'https',
            host: 'nas.domain.com',
        });
    });

    it('falls back to hostname and headers.host when needed', () => {
        const req = {
            headers: {
                host: 'localhost:3000',
            },
            hostname: 'localhost',
            protocol: 'http',
        } as FastifyRequest;

        expect(extractRequestOriginInfo(req)).toEqual({
            protocol: 'http',
            host: 'localhost',
        });
    });

    it('extracts full request info with fallback values', () => {
        const req = {
            headers: {},
            hostname: 'localhost:3000',
            protocol: 'http',
            url: '/callback?code=123&state=456',
        } as FastifyRequest;

        expect(extractRequestInfo(req)).toEqual({
            protocol: 'http',
            host: 'localhost:3000',
            fullUrl: 'http://localhost:3000/callback?code=123&state=456',
            baseUrl: 'http://localhost:3000',
        });
    });
});
