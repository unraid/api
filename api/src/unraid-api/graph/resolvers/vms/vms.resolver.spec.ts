import { Test, type TestingModule } from '@nestjs/testing';
import { VmsResolver } from './vms.resolver';

describe('VmsResolver', () => {
  let resolver: VmsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VmsResolver],
    }).compile();

    resolver = module.get<VmsResolver>(VmsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
