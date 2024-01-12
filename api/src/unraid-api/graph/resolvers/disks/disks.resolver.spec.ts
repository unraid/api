import { Test, type TestingModule } from '@nestjs/testing';
import { DisksResolver } from './disks.resolver';

describe('DisksResolver', () => {
  let resolver: DisksResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DisksResolver],
    }).compile();

    resolver = module.get<DisksResolver>(DisksResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
