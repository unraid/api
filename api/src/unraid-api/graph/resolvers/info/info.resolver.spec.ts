import { Test, TestingModule } from '@nestjs/testing';
import { InfoResolver } from './info.resolver';

describe('InfoResolver', () => {
  let resolver: InfoResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InfoResolver],
    }).compile();

    resolver = module.get<InfoResolver>(InfoResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
