import { createServer } from 'node:http';

import { describe, expect, it } from 'vitest';

import {
    controlPlaneOrigin,
    requestControlPlane,
    validHostname,
    webguiHostnames,
} from './control-plane.js';

describe('control plane boundary', () => {
    it.each([
        'http://example.com',
        'https://user:secret@example.com',
        'https://example.com/path',
        'https://example.com/?token=secret',
        'https://example.com/#fragment',
        '',
    ])('rejects unsafe origins: %s', (url) => {
        expect(() => controlPlaneOrigin(url)).toThrow();
    });
    it('accepts HTTPS and loopback test origins', () => {
        expect(controlPlaneOrigin('https://connect.example.com/')).toBe('https://connect.example.com');
        expect(controlPlaneOrigin('http://127.0.0.1:8000')).toBe('http://127.0.0.1:8000');
    });
    it('accepts only a tunnel hostname', () => {
        expect(validHostname(`tun-${'a'.repeat(32)}.server.myunraid.net`)).toBe(true);
        expect(validHostname(`tun-${'a'.repeat(32)}.server.preview.myunraid.net`)).toBe(true);
        for (const name of [
            'other.example.com',
            `tun-${'a'.repeat(32)}.server.preview.myunraid.net.evil`,
            `tun-${'a'.repeat(32)}.server.unknown.myunraid.net`,
            `tun-${'a'.repeat(32)}.server.myunraid.net.evil`,
            'https://server.myunraid.net',
            'a.myunraid.net\ninvalid',
        ])
            expect(validHostname(name)).toBe(false);
    });
    it('accepts stable aliases but rejects absent or disabled primary routes', () => {
        const stable = `srv-${'a'.repeat(32)}.server.preview.myunraid.net`;
        expect(validHostname(stable)).toBe(true);
        const route = { purpose: 'webgui', hostname: stable, enabled: true };
        expect(webguiHostnames([route], stable)).toEqual([stable]);
        expect(() => webguiHostnames(undefined, stable)).toThrow();
        expect(() => webguiHostnames([{ ...route, enabled: false }], stable)).toThrow();
        expect(() => webguiHostnames([{ ...route, purpose: 'plex' }], stable)).toThrow();
    });
    it('does not forward the API key through an HTTP redirect', async () => {
        let redirected = false;
        const server = createServer((request, response) => {
            if (request.url === '/redirected') redirected = true;
            response.writeHead(302, { Location: '/redirected' });
            response.end();
        });
        await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
        try {
            const address = server.address();
            if (!address || typeof address === 'string') throw new Error('Missing test port');
            await expect(
                requestControlPlane(
                    `http://127.0.0.1:${address.port}`,
                    'test-key',
                    '/presence/state/enable',
                    'POST'
                )
            ).rejects.toThrow();
            expect(redirected).toBe(false);
        } finally {
            server.closeAllConnections();
            await new Promise<void>((resolve) => server.close(() => resolve()));
        }
    });
});
