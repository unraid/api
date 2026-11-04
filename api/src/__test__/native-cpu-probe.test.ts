import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { expect, it } from 'vitest';

it('loads Docker support and completes SSH negotiation without native CPU probing', () => {
    const result = spawnSync(
        process.execPath,
        [
            '-e',
            `
                const Module = require('node:module');
                const load = Module._load;
                Module._load = function (id, ...args) {
                    if (id === 'cpu-features') {
                        process.stderr.write('Native CPU probing attempted');
                        process.exit(86);
                    }
                    return load.call(this, id, ...args);
                };
                const Docker = require('dockerode');
                new Docker({ socketPath: '/var/run/docker.sock' });

                const dockerRequire = Module.createRequire(require.resolve('dockerode'));
                const modemRequire = Module.createRequire(dockerRequire.resolve('docker-modem'));
                const { Client, Server } = modemRequire('ssh2');
                const { generateKeyPairSync } = require('node:crypto');
                const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
                const server = new Server({
                    hostKeys: [privateKey.export({ type: 'pkcs1', format: 'pem' })],
                }, (connection) => {
                    connection.on('error', (error) => { throw error; });
                    connection.on('authentication', (context) => context.accept());
                });
                server.on('error', (error) => { throw error; });
                server.listen(0, '127.0.0.1', () => {
                    const client = new Client();
                    client.on('error', (error) => { throw error; });
                    client.on('ready', () => {
                        client.end();
                        server.close();
                    });
                    client.connect({
                        host: '127.0.0.1',
                        port: server.address().port,
                        username: 'test',
                        hostVerifier: () => true,
                    });
                });
            `,
        ],
        {
            cwd: fileURLToPath(new URL('../../', import.meta.url)),
            encoding: 'utf8',
            timeout: 15_000,
        }
    );

    expect(result.error).toBeUndefined();
    expect(result.signal).toBeNull();
    expect(result.status, result.stderr).toBe(0);
});
