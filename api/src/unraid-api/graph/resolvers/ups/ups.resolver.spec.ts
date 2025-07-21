import { Test, TestingModule } from '@nestjs/testing';
import { UPSResolver } from './ups.resolver.js';
import { UPSService, UPSData } from './ups.service.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UPSConfigInput } from './ups.inputs.js';
import { PubSub } from 'graphql-subscriptions';

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
          },
        },
        {
          provide: PubSub,
          useValue: {
            publish: vi.fn(),
            asyncIterator: vi.fn(),
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
        SERVICE: 'enable',
        UPSCABLE: 'usb',
        UPSTYPE: 'usb',
        BATTERYLEVEL: 10,
        MINUTES: 5,
        TIMEOUT: 0,
        KILLUPS: 'no',
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
      expect(pubSub.asyncIterator).toHaveBeenCalledWith('upsUpdates');
    });
  });
});
