import { Test, TestingModule } from '@nestjs/testing';
import { OwnerResolver } from './owner.resolver';

describe('OwnerResolver', () => {
  let resolver: OwnerResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OwnerResolver],
    }).compile();

    resolver = module.get<OwnerResolver>(OwnerResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
