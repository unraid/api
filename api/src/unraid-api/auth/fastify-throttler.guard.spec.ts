import { Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host.js';
import { ThrottlerStorageService } from '@nestjs/throttler';
import { mkdtemp, rm } from 'node:fs/promises';
import http from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import Fastify from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';

import { FastifyThrottlerGuard } from '@app/unraid-api/auth/fastify-throttler.guard.js';

describe('FastifyThrottlerGuard client identity', () => {
    const cleanups: Array<() => Promise<void> | void> = [];
    afterEach(async () => {
        for (const cleanup of cleanups.reverse()) await cleanup();
        cleanups.length = 0;
    });

    const createServer = async () => {
        const storage = new ThrottlerStorageService();
        cleanups.push(() => storage.onApplicationShutdown());
        const guard = new FastifyThrottlerGuard([{ ttl: 60_000, limit: 2 }], storage, new Reflector());
        await guard.onModuleInit();
        const server = Fastify({ trustProxy: 'loopback' });
        cleanups.push(() => server.close());
        class Controller {
            authorize() {}
            callback() {}
        }
        for (const path of ['/authorize', '/callback']) {
            const handler =
                path === '/authorize' ? Controller.prototype.authorize : Controller.prototype.callback;
            server.get(path, async (req, res) => {
                const context = new ExecutionContextHost([req, res], Controller, handler);
                try {
                    await guard.canActivate(context);
                    return res.code(204).send();
                } catch (error) {
                    const status =
                        error instanceof Error &&
                        'getStatus' in error &&
                        typeof error.getStatus === 'function'
                            ? error.getStatus()
                            : 500;
                    return res.code(status).send();
                }
            });
        }
        return server;
    };

    it('uses the actual TCP peer even when loopback clients forge forwarded headers', async () => {
        const server = await createServer();
        for (const forwarded of ['192.0.2.1', '192.0.2.2']) {
            expect(
                (
                    await server.inject({
                        url: '/authorize',
                        remoteAddress: '127.0.0.2',
                        headers: { 'x-forwarded-for': forwarded },
                    })
                ).statusCode
            ).toBe(204);
        }
        expect(
            (
                await server.inject({
                    url: '/authorize',
                    remoteAddress: '127.0.0.2',
                    headers: { 'x-forwarded-for': '192.0.2.3' },
                })
            ).statusCode
        ).toBe(429);
        expect((await server.inject({ url: '/authorize', remoteAddress: '127.0.0.3' })).statusCode).toBe(
            204
        );
        expect((await server.inject({ url: '/callback', remoteAddress: '127.0.0.2' })).statusCode).toBe(
            204
        );
    });

    it('keeps Unix socket clients independent and rejects missing or ambiguous identity', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'api-ip-'));
        cleanups.push(() => rm(directory, { recursive: true, force: true }));
        const server = await createServer();
        const socketPath = join(directory, 'api.sock');
        await server.listen({ path: socketPath });
        const send = (address?: string) =>
            new Promise<number | undefined>((resolve, reject) => {
                const request = http.get(
                    {
                        socketPath,
                        path: '/authorize',
                        headers: address ? { 'x-forwarded-for': address } : {},
                    },
                    (response) => {
                        response.resume();
                        response.on('end', () => resolve(response.statusCode));
                    }
                );
                request.on('error', reject);
            });
        expect(await send('192.0.2.1')).toBe(204);
        expect(await send('192.0.2.1')).toBe(204);
        expect(await send('192.0.2.1')).toBe(429);
        expect(await send('192.0.2.2')).toBe(204);
        expect(await send()).toBe(400);
        expect(await send('192.0.2.1, 192.0.2.2')).toBe(400);
        expect(await send('invalid')).toBe(400);
    });
});
