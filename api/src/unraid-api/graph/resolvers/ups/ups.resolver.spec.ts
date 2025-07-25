import { Test, TestingModule } from '@nestjs/testing';

import { PubSub } from 'graphql-subscriptions';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    UPSCableType,
    UPSConfigInput,
    UPSKillPower,
    UPSServiceState,
    UPSType,
} from '@app/unraid-api/graph/resolvers/ups/ups.inputs.js';
import { UPSResolver } from '@app/unraid-api/graph/resolvers/ups/ups.resolver.js';
import { UPSData, UPSService } from '@app/unraid-api/graph/resolvers/ups/ups.service.js';

describe('UPSResolver', () => {
    let resolver: UPSResolver;
    let service: UPSService;
    let pubSub: PubSub;

    const mockUPSData: UPSData = {
        MODEL: 'Test UPS',
        STATUS: 'Online',
        BCHARGE: '100',
        TIMELEFT: '3600',
        LINEV: '120.5',
        OUTPUTV: '120.5',
        LOADPCT: '25',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UPSResolver,
                {
                    provide: UPSService,
                    useValue: {
                        getUPSData: vi.fn().mockResolvedValue(mockUPSData),
                        configureUPS: vi.fn().mockResolvedValue(undefined),
                        getCurrentConfig: vi.fn().mockResolvedValue({}),
                    },
                },
                {
                    provide: PubSub,
                    useValue: {
                        publish: vi.fn(),
                        asyncIterableIterator: vi.fn(),
                    },
                },
            ],
        }).compile();

        resolver = module.get<UPSResolver>(UPSResolver);
        service = module.get<UPSService>(UPSService);
        pubSub = module.get<PubSub>(PubSub);
    });

    it('should be defined', () => {
        expect(resolver).toBeDefined();
    });

    describe('upsDevices', () => {
        it('should return an array of UPS devices', async () => {
            const result = await resolver.upsDevices();
            expect(result).toBeInstanceOf(Array);
            expect(result[0].model).toBe('Test UPS');
            expect(service.getUPSData).toHaveBeenCalled();
        });
    });

    describe('configureUps', () => {
        it('should call the configureUPS service method and return true', async () => {
            const config: UPSConfigInput = {
                service: UPSServiceState.ENABLE,
                upsCable: UPSCableType.USB,
                upsType: UPSType.USB,
                batteryLevel: 10,
                minutes: 5,
                timeout: 0,
                killUps: UPSKillPower.NO,
            };
            const result = await resolver.configureUps(config);
            expect(result).toBe(true);
            expect(service.configureUPS).toHaveBeenCalledWith(config);
            expect(pubSub.publish).toHaveBeenCalledWith('upsUpdates', expect.any(Object));
        });
    });

    describe('upsUpdates', () => {
        it('should return an async iterator', () => {
            resolver.upsUpdates();
            expect(pubSub.asyncIterableIterator).toHaveBeenCalledWith('upsUpdates');
        });
    });
});
