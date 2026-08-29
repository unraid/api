import { ConfigService } from '@nestjs/config';

import { describe, expect, it } from 'vitest';

import { ConnectStatusWriterService } from './connect-status-writer.service.js';

describe('Connect status failures', () => {
    it('does not prevent shutdown if the status directory is unavailable', async () => {
        const service = new ConnectStatusWriterService(
            new ConfigService({ PATHS_CONNECT_STATUS_FILE_PATH: '/missing-connect-fixture/status.json' })
        );
        await expect(service.onApplicationBootstrap()).resolves.toBeUndefined();
        await expect(service.onModuleDestroy()).resolves.toBeUndefined();
    });
});
