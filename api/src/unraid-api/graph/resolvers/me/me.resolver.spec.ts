import { Test, TestingModule } from '@nestjs/testing';
import { MeResolver } from './me.resolver';

describe('MeResolver', () => {
  let resolver: MeResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MeResolver],
    }).compile();

    resolver = module.get<MeResolver>(MeResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
