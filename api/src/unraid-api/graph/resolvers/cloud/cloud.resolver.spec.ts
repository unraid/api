import { Test, type TestingModule } from '@nestjs/testing';
import { CloudResolver } from './cloud.resolver';

describe('CloudResolver', () => {
  let resolver: CloudResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CloudResolver],
    }).compile();

    resolver = module.get<CloudResolver>(CloudResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
