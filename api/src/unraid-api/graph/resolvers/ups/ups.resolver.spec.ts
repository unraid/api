import { Test, TestingModule } from '@nestjs/testing';
import { UPSResolver } from './ups.resolver';
import { UPSService, UPSData } from './ups.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('UPSResolver', () => {
  let resolver: UPSResolver;
  let service: UPSService;

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
          },
        },
      ],
    }).compile();

    resolver = module.get<UPSResolver>(UPSResolver);
    service = module.get<UPSService>(UPSService);
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
});
