import { Test, type TestingModule } from '@nestjs/testing';
import { OnlineResolver } from './online.resolver';

describe('OnlineResolver', () => {
  let resolver: OnlineResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OnlineResolver],
    }).compile();

    resolver = module.get<OnlineResolver>(OnlineResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
