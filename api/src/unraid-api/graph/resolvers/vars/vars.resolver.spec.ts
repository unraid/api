import { Test, TestingModule } from '@nestjs/testing';
import { VarsResolver } from './vars.resolver';

describe('VarsResolver', () => {
  let resolver: VarsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VarsResolver],
    }).compile();

    resolver = module.get<VarsResolver>(VarsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
