import { Test, type TestingModule } from '@nestjs/testing';
import { ArrayResolver } from './array.resolver';

describe('ArrayResolver', () => {
  let resolver: ArrayResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArrayResolver],
    }).compile();

    resolver = module.get<ArrayResolver>(ArrayResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
