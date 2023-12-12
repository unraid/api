import { Test, TestingModule } from '@nestjs/testing';
import { ConfigResolver } from './config.resolver';

describe('ConfigResolver', () => {
  let resolver: ConfigResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfigResolver],
    }).compile();

    resolver = module.get<ConfigResolver>(ConfigResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
