import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { describe, expect, it } from 'vitest';

import { ConnectConfigPersister } from '../config/config.persistence.js';
import { emptyMyServersConfig } from '../config/connect.config.js';
import { CloudService } from '../connection-status/cloud.service.js';
import { UrlResolverService } from '../network/url-resolver.service.js';
import { ConnectTunnelService } from '../tunnel/connect-tunnel.service.js';

describe('cloud status', () => {
    it('does not claim a cloud connection from local credentials', async () => {
        const config = new ConfigService({
            connect: { config: { ...emptyMyServersConfig(), apikey: 'test-key' } },
        });
        const tunnel = new ConnectTunnelService(
            config,
            new ConnectConfigPersister(config),
            new UrlResolverService(config),
            new EventEmitter2(),
            { reload: async () => true },
            { getProviders: async () => [] } as never
        );
        const cloud = new CloudService(tunnel);
        expect(cloud.checkConnector().status).toBe('PRE_INIT');
        expect((await cloud.checkCloudConnection()).status).toBe('disconnected');
    });
});
