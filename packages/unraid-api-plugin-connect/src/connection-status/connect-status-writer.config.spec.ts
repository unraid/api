import { ConfigService } from '@nestjs/config';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { blankStatus } from '../tunnel/connect-tunnel.service.js';
import { ConnectStatusWriterService } from './connect-status-writer.service.js';

describe('Connect status file', () => {
    let directory: string;
    let config: ConfigService;
    let service: ConnectStatusWriterService;
    beforeEach(async () => {
        directory = await mkdtemp(join(tmpdir(), 'connect-status-'));
        config = new ConfigService({ PATHS_CONNECT_STATUS_FILE_PATH: join(directory, 'status.json') });
        service = new ConnectStatusWriterService(config);
    });
    afterEach(async () => {
        await service.onModuleDestroy();
        await rm(directory, { force: true, recursive: true });
    });
    it('reflects native presence and does not invent a heartbeat', async () => {
        await service.onApplicationBootstrap();
        expect(JSON.parse(await readFile(service.statusFilePath, 'utf8')).connectionStatus).toBe(
            'PRE_INIT'
        );
        for (const presence of ['starting', 'connected', 'disconnected']) {
            config.set('connect.tunnel', { ...blankStatus(), presence, reason: 'migrate' });
            await service.writeStatus();
            expect(JSON.parse(await readFile(service.statusFilePath, 'utf8'))).toMatchObject({
                connectionStatus:
                    presence === 'connected'
                        ? 'CONNECTED'
                        : presence === 'starting'
                          ? 'CONNECTING'
                          : 'PRE_INIT',
                lastPing: null,
                error: null,
                allowedOrigins: '',
            });
        }
    });
    it('finishes queued writes before shutdown and ignores later status events', async () => {
        const write = service.writeStatus();
        await service.onModuleDestroy();
        await write;
        await service.writeStatus();
        await expect(stat(service.statusFilePath)).rejects.toThrow();
        await expect(stat(`${service.statusFilePath}.tmp`)).rejects.toThrow();
    });
});
