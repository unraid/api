import type { TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getters } from '@app/store/index.js';
import { ServerResolver } from '@app/unraid-api/graph/resolvers/servers/server.resolver.js';
import { ServerService } from '@app/unraid-api/graph/resolvers/servers/server.service.js';

vi.mock('@app/store/index.js', () => ({
    getters: {
        emhttp: vi.fn(),
    },
}));

describe('ServersResolver', () => {
    let resolver: ServerResolver;
    let mockConfigService: { get: ReturnType<typeof vi.fn> };

    beforeEach(async () => {
        mockConfigService = {
            get: vi.fn(),
        };

        vi.mocked(getters.emhttp).mockReturnValue({
            var: {
                regGuid: 'GUID-123',
                name: 'Tower',
                comment: 'Primary host',
                port: 80,
            },
            networks: [{ ipaddr: ['192.168.1.10'] }],
            nginx: {
                defaultUrl: 'https://Tower.local:4443',
            },
        } as ReturnType<typeof getters.emhttp>);
        mockConfigService.get.mockReturnValue({
            config: {
                username: 'ajit',
                apikey: 'api-key-123',
            },
        });

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ServerResolver,
                {
                    provide: ServerService,
                    useValue: {},
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        resolver = module.get<ServerResolver>(ServerResolver);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });

    it('returns the shared server shape with defaultUrl for the server query', async () => {
        await expect(resolver.server()).resolves.toEqual({
            id: 'local',
            owner: {
                id: 'local',
                username: 'ajit',
                url: '',
                avatar: '',
            },
            guid: 'GUID-123',
            apikey: 'api-key-123',
            name: 'Tower',
            comment: 'Primary host',
            status: 'ONLINE',
            wanip: '',
            lanip: '192.168.1.10',
            localurl: 'http://192.168.1.10:80',
            remoteurl: '',
            defaultUrl: 'https://Tower.local:4443',
        });
    });
});
