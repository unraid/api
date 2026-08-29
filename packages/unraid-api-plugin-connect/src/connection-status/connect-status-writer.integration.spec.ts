import { ConfigService } from '@nestjs/config';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect, it, vi } from 'vitest';

import { ConnectStatusWriterService } from './connect-status-writer.service.js';

it('writes connector events through the Nest event subscription', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'connect-events-'));
    const path = join(directory, 'status.json');
    const config = new ConfigService({ PATHS_CONNECT_STATUS_FILE_PATH: path });
    const app = await Test.createTestingModule({
        imports: [EventEmitterModule.forRoot()],
        providers: [
            {
                provide: ConnectStatusWriterService,
                useFactory: () => new ConnectStatusWriterService(config),
            },
        ],
    }).compile();
    try {
        await app.init();
        config.set('connect.tunnel', { presence: 'connected', reason: '' });
        await app.get(EventEmitter2).emitAsync('connect.tunnel.changed');
        await vi.waitFor(async () =>
            expect(JSON.parse(await readFile(path, 'utf8')).connectionStatus).toBe('CONNECTED')
        );
    } finally {
        await app.close();
        await rm(directory, { recursive: true, force: true });
    }
});
