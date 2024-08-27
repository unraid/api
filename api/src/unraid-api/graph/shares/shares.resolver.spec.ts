import { Test, type TestingModule } from '@nestjs/testing';
import { SharesResolver } from './shares.resolver';

describe('SharesResolver', () => {
  let resolver: SharesResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SharesResolver],
    }).compile();

    resolver = module.get<SharesResolver>(SharesResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
