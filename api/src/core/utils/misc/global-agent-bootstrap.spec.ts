import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { expect, it } from 'vitest';

it('preserves proxy requests, TLS options and diagnostic logging', async () => {
    // Bootstrap replaces process-wide agents. Keep real network checks in a child
    // so other tests cannot inherit its agents or proxy configuration.
    const env = Object.fromEntries(
        Object.entries(process.env).filter(
            ([key]) => !key.startsWith('GLOBAL_AGENT_') && !key.startsWith('NODE_')
        )
    );
    const { stdout } = await promisify(execFile)(
        process.execPath,
        [
            '--input-type=module',
            '--eval',
            String.raw`
                import assert from 'node:assert/strict';
                import { execFileSync } from 'node:child_process';
                import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
                import http from 'node:http';
                import https from 'node:https';
                import net from 'node:net';
                import { tmpdir } from 'node:os';
                import { join } from 'node:path';

                const directory = mkdtempSync(join(tmpdir(), 'proxy-bootstrap-'));
                const sockets = new Set();
                const servers = [];
                const track = socket => {
                    sockets.add(socket);
                    socket.on('close', () => sockets.delete(socket));
                    socket.on('error', () => {});
                    return socket;
                };
                const listen = async (server, address = 0) => {
                    servers.push(server);
                    server.on('connection', track);
                    await new Promise(resolve => server.listen(address, '127.0.0.1', resolve));
                    return server.address().port;
                };
                const request = (client, target, options = {}) => new Promise((resolve, reject) => {
                    const outgoing = client.get(target, options, response => {
                        let body = '';
                        response.setEncoding('utf8');
                        response.on('data', chunk => { body += chunk; });
                        response.on('end', () => resolve(body));
                    });
                    outgoing.on('error', reject);
                    outgoing.setTimeout(3000, () => outgoing.destroy(new Error('request timed out')));
                });

                try {
                    execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes',
                        '-keyout', join(directory, 'key.pem'), '-out', join(directory, 'cert.pem'),
                        '-days', '1', '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost'
                    ], { stdio: 'ignore' });
                    const cert = readFileSync(join(directory, 'cert.pem'));
                    const tlsHostnames = [];
                    const secure = https.createServer({ cert, key: readFileSync(join(directory, 'key.pem')) },
                        (incoming, response) => {
                            tlsHostnames.push(incoming.socket.servername);
                            response.end('secure');
                        });
                    const securePort = await listen(secure);
                    const directPort = await listen(http.createServer((incoming, response) => response.end('direct')));
                    const paths = [];
                    const authorizations = [];
                    const connectTargets = [];
                    const proxy = http.createServer((incoming, response) => {
                        paths.push(incoming.url);
                        authorizations.push(incoming.headers['proxy-authorization']);
                        response.end('proxied');
                    });
                    proxy.on('connect', (incoming, socket, head) => {
                        connectTargets.push(incoming.url);
                        const upstream = track(net.connect(securePort, '127.0.0.1', () => {
                            socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
                            if (head.length) upstream.write(head);
                            upstream.pipe(socket);
                            socket.pipe(upstream);
                        }));
                        socket.on('close', () => upstream.destroy());
                        upstream.on('close', () => socket.destroy());
                    });
                    const proxyPort = await listen(proxy);
                    await import('global-agent/bootstrap.js');
                    assert.ok(globalThis.GLOBAL_AGENT);
                    assert.equal(await request(http, 'http://127.0.0.1:' + directPort), 'direct');
                    globalThis.GLOBAL_AGENT.HTTP_PROXY = 'http://127.0.0.1:' + proxyPort;
                    assert.equal(await request(http, 'http://proxy-target.invalid:1234/path'), 'proxied');
                    assert.deepEqual(paths, ['http://proxy-target.invalid:1234/path']);
                    globalThis.GLOBAL_AGENT.NO_PROXY = '127.0.0.1';
                    assert.equal(await request(http, 'http://127.0.0.1:' + directPort), 'direct');
                    globalThis.GLOBAL_AGENT.NO_PROXY = '';
                    assert.equal(paths.length, 1);
                    globalThis.GLOBAL_AGENT.HTTP_PROXY = 'http://user:p%40ss%3Aword@127.0.0.1:' + proxyPort;
                    assert.equal(await request(http, 'http://proxy-target.invalid:1234/auth'), 'proxied');
                    assert.equal(authorizations.at(-1), 'Basic ' + Buffer.from('user:p@ss:word').toString('base64'));
                    globalThis.GLOBAL_AGENT.HTTP_PROXY = 'http://127.0.0.1:' + proxyPort;
                    const target = 'https://localhost:' + securePort;
                    await assert.rejects(request(https, target), { code: 'DEPTH_ZERO_SELF_SIGNED_CERT' });
                    assert.equal(await request(https, target, { ca: cert }), 'secure');
                    assert.equal(tlsHostnames.at(-1), 'localhost');
                    await assert.rejects(request(https, 'https://wrong.invalid:' + securePort, { ca: cert }),
                        { code: 'ERR_TLS_CERT_ALTNAME_INVALID' });
                    assert.equal(await request(https, 'https://wrong.invalid:' + securePort,
                        { ca: cert, servername: 'localhost' }), 'secure');
                    assert.equal(await request(https, target, { rejectUnauthorized: false }), 'secure');
                    assert.deepEqual(connectTargets, [
                        'localhost:' + securePort, 'localhost:' + securePort,
                        'wrong.invalid:' + securePort, 'wrong.invalid:' + securePort, 'localhost:' + securePort
                    ]);
                    console.log('proxy compatibility passed');
                } finally {
                    for (const socket of sockets) socket.destroy();
                    await Promise.all(servers.map(server => new Promise(resolve => server.close(resolve))));
                    rmSync(directory, { recursive: true, force: true });
                }
            `,
        ],
        { env: { ...env, ROARR_LOG: 'true' }, timeout: 15000 }
    );
    expect(stdout).toContain('proxy compatibility passed');
    const records = stdout
        .split('\n')
        .filter((line) => line.startsWith('{'))
        .map((line) => JSON.parse(line));
    expect(records.some((record) => record.context?.package === 'global-agent')).toBe(true);
}, 20000);
