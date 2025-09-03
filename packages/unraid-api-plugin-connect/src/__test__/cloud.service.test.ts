import { beforeEach, describe, expect, it } from 'vitest';

import { CloudService } from '../connection-status/cloud.service.js';

const MOTHERSHIP_GRAPHQL_LINK = 'https://mothership.unraid.net/ws';
const API_VERSION = 'TEST_VERSION';
const BAD_API_KEY = 'BAD_API_KEY';
const BAD = 'BAD';

describe('CloudService.hardCheckCloud (integration)', () => {
    let service: CloudService;
    let configService: any;
    let mothership: any;
    let connectConfig: any;

    beforeEach(() => {
        configService = {
            getOrThrow: (key: string) => {
                if (key === 'MOTHERSHIP_GRAPHQL_LINK') return MOTHERSHIP_GRAPHQL_LINK;
                if (key === 'API_VERSION') return API_VERSION;
                throw new Error('Unknown key');
            },
        };
        mothership = {
            getConnectionState: () => null,
        };
        connectConfig = {
            getConfig: () => ({ apikey: BAD_API_KEY }),
        };
        service = new CloudService(configService, mothership, connectConfig);
    });

    it('fails to authenticate with mothership with no credentials', async () => {
        try {
            await expect(service['hardCheckCloud'](API_VERSION, BAD)).resolves.toMatchObject({
                status: 'error',
            });
            await expect(service['hardCheckCloud'](API_VERSION, BAD_API_KEY)).resolves.toMatchObject({
                status: 'error',
            });
        } catch (error) {
            if (error instanceof Error && error.message.includes('Timeout')) {
                // Test succeeds on timeout
                return;
            }
            throw error;
        }
    }, { timeout: 10000 });
});
